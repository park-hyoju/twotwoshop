-- =============================================================================
-- TWOTWOSHOP: Inquiry image attachments + contact-based lookup
-- =============================================================================
-- Run after inquiry-chat-system.sql
-- =============================================================================

alter table public.customer_inquiries
  add column if not exists image_urls text[] not null default '{}';

alter table public.customer_inquiries
  add column if not exists order_reference text;

alter table public.customer_inquiry_messages
  add column if not exists image_urls text[] not null default '{}';

comment on column public.customer_inquiries.image_urls is
  '고객이 첨부한 문의 이미지 public URL 배열';

comment on column public.customer_inquiries.order_reference is
  '주문번호 또는 상품명 (선택 입력)';

-- -----------------------------------------------------------------------------
-- Storage: customer-inquiry-images
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-inquiry-images',
  'customer-inquiry-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read inquiry images" on storage.objects;
create policy "Public read inquiry images"
on storage.objects
for select
to public
using (bucket_id = 'customer-inquiry-images');

drop policy if exists "Anon upload inquiry images" on storage.objects;
create policy "Anon upload inquiry images"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'customer-inquiry-images'
  and (storage.foldername(name))[1] in ('pending', 'inquiries')
);

-- -----------------------------------------------------------------------------
-- Submit inquiry (with attachments)
-- -----------------------------------------------------------------------------
create or replace function public.submit_customer_inquiry(
  p_name text,
  p_phone text,
  p_email text,
  p_type text,
  p_message text,
  p_image_urls text[] default '{}',
  p_order_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_id uuid;
  v_images text[];
begin
  if length(trim(coalesce(p_name, ''))) = 0
    or length(trim(coalesce(p_phone, ''))) = 0
    or length(trim(coalesce(p_message, ''))) = 0 then
    raise exception 'INVALID_INQUIRY_INPUT';
  end if;

  if p_type not in ('shipping', 'exchange', 'refund', 'product', 'other') then
    raise exception 'INVALID_INQUIRY_TYPE';
  end if;

  v_images := coalesce(p_image_urls, '{}');
  v_code := public.generate_inquiry_code();

  insert into public.customer_inquiries (
    inquiry_code,
    inquiry_number,
    name,
    phone,
    email,
    type,
    message,
    status,
    image_urls,
    order_reference
  )
  values (
    v_code,
    v_code,
    trim(p_name),
    trim(p_phone),
    nullif(trim(coalesce(p_email, '')), ''),
    p_type,
    trim(p_message),
    'pending',
    v_images,
    nullif(trim(coalesce(p_order_reference, '')), '')
  )
  returning id into v_id;

  insert into public.customer_inquiry_messages (inquiry_id, sender, message, image_urls)
  values (v_id, 'customer', trim(p_message), v_images);

  return jsonb_build_object(
    'id', v_id,
    'inquiry_code', v_code
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- List inquiries by name + phone (customer lookup)
-- -----------------------------------------------------------------------------
create or replace function public.get_customer_inquiries_by_contact(
  p_name text,
  p_phone text
)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', i.id,
        'type', i.type,
        'status', i.status,
        'message', i.message,
        'created_at', i.created_at,
        'updated_at', i.updated_at,
        'image_urls', coalesce(i.image_urls, '{}'::text[])
      )
      order by i.updated_at desc
    ),
    '[]'::jsonb
  )
  from public.customer_inquiries i
  where trim(i.name) = trim(p_name)
    and public.normalize_inquiry_phone(i.phone) = public.normalize_inquiry_phone(p_phone)
  limit 20;
$$;

-- -----------------------------------------------------------------------------
-- Full thread by id + identity verification
-- -----------------------------------------------------------------------------
create or replace function public.get_customer_inquiry_by_id(
  p_id uuid,
  p_name text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inquiry public.customer_inquiries%rowtype;
  v_messages jsonb;
begin
  select *
  into v_inquiry
  from public.customer_inquiries
  where id = p_id
    and trim(name) = trim(p_name)
    and public.normalize_inquiry_phone(phone) = public.normalize_inquiry_phone(p_phone)
  limit 1;

  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'sender', m.sender,
        'message', m.message,
        'image_urls', coalesce(m.image_urls, '{}'::text[]),
        'created_at', m.created_at
      )
      order by m.created_at asc
    ),
    '[]'::jsonb
  )
  into v_messages
  from public.customer_inquiry_messages m
  where m.inquiry_id = v_inquiry.id;

  return jsonb_build_object(
    'id', v_inquiry.id,
    'inquiry_code', v_inquiry.inquiry_code,
    'name', v_inquiry.name,
    'phone', v_inquiry.phone,
    'email', v_inquiry.email,
    'type', v_inquiry.type,
    'status', v_inquiry.status,
    'message', v_inquiry.message,
    'admin_reply', v_inquiry.admin_reply,
    'image_urls', coalesce(v_inquiry.image_urls, '{}'::text[]),
    'order_reference', v_inquiry.order_reference,
    'created_at', v_inquiry.created_at,
    'updated_at', v_inquiry.updated_at,
    'messages', v_messages
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Follow-up message by inquiry id
-- -----------------------------------------------------------------------------
create or replace function public.add_customer_inquiry_message(
  p_inquiry_id uuid,
  p_name text,
  p_phone text,
  p_message text,
  p_image_urls text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inquiry public.customer_inquiries%rowtype;
  v_message_id uuid;
  v_images text[];
begin
  if length(trim(coalesce(p_message, ''))) = 0 then
    raise exception 'INVALID_MESSAGE';
  end if;

  v_images := coalesce(p_image_urls, '{}');

  select *
  into v_inquiry
  from public.customer_inquiries
  where id = p_inquiry_id
    and trim(name) = trim(p_name)
    and public.normalize_inquiry_phone(phone) = public.normalize_inquiry_phone(p_phone)
  limit 1;

  if not found then
    return null;
  end if;

  insert into public.customer_inquiry_messages (inquiry_id, sender, message, image_urls)
  values (v_inquiry.id, 'customer', trim(p_message), v_images)
  returning id into v_message_id;

  update public.customer_inquiries
  set status = 'pending',
      updated_at = now()
  where id = v_inquiry.id;

  return jsonb_build_object('id', v_message_id);
end;
$$;

-- Keep legacy code-based lookup for admin compatibility (include image_urls)
create or replace function public.get_customer_inquiry_by_code(
  p_inquiry_code text,
  p_name text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inquiry public.customer_inquiries%rowtype;
begin
  select *
  into v_inquiry
  from public.customer_inquiries
  where upper(trim(inquiry_code)) = upper(trim(p_inquiry_code))
    and trim(name) = trim(p_name)
    and public.normalize_inquiry_phone(phone) = public.normalize_inquiry_phone(p_phone)
  limit 1;

  if not found then
    return null;
  end if;

  return public.get_customer_inquiry_by_id(v_inquiry.id, p_name, p_phone);
end;
$$;

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
revoke all on function public.submit_customer_inquiry(text, text, text, text, text, text[], text) from public;
revoke all on function public.get_customer_inquiries_by_contact(text, text) from public;
revoke all on function public.get_customer_inquiry_by_id(uuid, text, text) from public;
revoke all on function public.add_customer_inquiry_message(uuid, text, text, text, text[]) from public;

grant execute on function public.submit_customer_inquiry(text, text, text, text, text, text[], text) to anon, authenticated;
grant execute on function public.get_customer_inquiries_by_contact(text, text) to anon, authenticated;
grant execute on function public.get_customer_inquiry_by_id(uuid, text, text) to anon, authenticated;
grant execute on function public.add_customer_inquiry_message(uuid, text, text, text, text[]) to anon, authenticated;
