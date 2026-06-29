-- =============================================================================
-- TWOTWOSHOP: Inquiry Chat System (문의번호 · 대화 · 운영상태)
-- =============================================================================
-- Run in Supabase SQL Editor after customer-inquiries.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- inquiry_code + expanded status
-- -----------------------------------------------------------------------------
alter table public.customer_inquiries
  add column if not exists inquiry_code text;

update public.customer_inquiries
set inquiry_code = coalesce(inquiry_code, inquiry_number)
where inquiry_code is null;

alter table public.customer_inquiries
  alter column inquiry_code set not null;

create unique index if not exists idx_customer_inquiries_inquiry_code
  on public.customer_inquiries (inquiry_code);

alter table public.customer_inquiries
  drop constraint if exists customer_inquiries_status_check;

update public.customer_inquiries
set status = 'answered'
where status = 'completed';

alter table public.customer_inquiries
  add constraint customer_inquiries_status_check
  check (status in ('pending', 'in_progress', 'answered', 'closed'));

create index if not exists idx_customer_inquiries_updated_at
  on public.customer_inquiries (updated_at desc);

-- -----------------------------------------------------------------------------
-- Daily inquiry code counter
-- -----------------------------------------------------------------------------
create table if not exists public.customer_inquiry_code_counters (
  date_key text primary key,
  last_number integer not null default 0 check (last_number >= 0)
);

comment on table public.customer_inquiry_code_counters is
  '문의번호 TT-YYYYMMDD-0001 일별 시퀀스 카운터';

-- -----------------------------------------------------------------------------
-- Message thread
-- -----------------------------------------------------------------------------
create table if not exists public.customer_inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.customer_inquiries(id) on delete cascade,
  sender text not null check (sender in ('customer', 'admin')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_inquiry_messages_inquiry_id
  on public.customer_inquiry_messages (inquiry_id, created_at asc);

comment on table public.customer_inquiry_messages is
  '고객·관리자 추가 대화 메시지. admin_note는 저장하지 않습니다.';

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.normalize_inquiry_phone(phone text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(phone, ''), '\D', '', 'g');
$$;

create or replace function public.generate_inquiry_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  date_part text;
  next_num integer;
begin
  date_part := to_char(timezone('Asia/Seoul', now()), 'YYYYMMDD');

  insert into public.customer_inquiry_code_counters as counters (date_key, last_number)
  values (date_part, 1)
  on conflict (date_key) do update
  set last_number = counters.last_number + 1
  returning last_number into next_num;

  return 'TT-' || date_part || '-' || lpad(next_num::text, 4, '0');
end;
$$;

-- -----------------------------------------------------------------------------
-- Public queue count (anon safe)
-- -----------------------------------------------------------------------------
create or replace function public.get_pending_inquiry_queue_count()
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer
  from public.customer_inquiries
  where status = 'pending';
$$;

-- -----------------------------------------------------------------------------
-- Submit inquiry (generates inquiry_code server-side)
-- -----------------------------------------------------------------------------
create or replace function public.submit_customer_inquiry(
  p_name text,
  p_phone text,
  p_email text,
  p_type text,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_id uuid;
begin
  if length(trim(coalesce(p_name, ''))) = 0
    or length(trim(coalesce(p_phone, ''))) = 0
    or length(trim(coalesce(p_message, ''))) = 0 then
    raise exception 'INVALID_INQUIRY_INPUT';
  end if;

  if p_type not in ('shipping', 'exchange', 'refund', 'product', 'other') then
    raise exception 'INVALID_INQUIRY_TYPE';
  end if;

  v_code := public.generate_inquiry_code();

  insert into public.customer_inquiries (
    inquiry_code,
    inquiry_number,
    name,
    phone,
    email,
    type,
    message,
    status
  )
  values (
    v_code,
    v_code,
    trim(p_name),
    trim(p_phone),
    nullif(trim(coalesce(p_email, '')), ''),
    p_type,
    trim(p_message),
    'pending'
  )
  returning id into v_id;

  insert into public.customer_inquiry_messages (inquiry_id, sender, message)
  values (v_id, 'customer', trim(p_message));

  return jsonb_build_object(
    'id', v_id,
    'inquiry_code', v_code
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Lookup inquiry by code + identity
-- -----------------------------------------------------------------------------
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
  v_messages jsonb;
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

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'sender', m.sender,
        'message', m.message,
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
    'created_at', v_inquiry.created_at,
    'updated_at', v_inquiry.updated_at,
    'messages', v_messages
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Customer follow-up message
-- -----------------------------------------------------------------------------
create or replace function public.add_customer_inquiry_message(
  p_inquiry_code text,
  p_name text,
  p_phone text,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inquiry public.customer_inquiries%rowtype;
  v_message_id uuid;
begin
  if length(trim(coalesce(p_message, ''))) = 0 then
    raise exception 'INVALID_MESSAGE';
  end if;

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

  insert into public.customer_inquiry_messages (inquiry_id, sender, message)
  values (v_inquiry.id, 'customer', trim(p_message))
  returning id into v_message_id;

  update public.customer_inquiries
  set status = 'pending',
      updated_at = now()
  where id = v_inquiry.id;

  return jsonb_build_object('id', v_message_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
revoke all on function public.generate_inquiry_code() from public;
revoke all on function public.submit_customer_inquiry(text, text, text, text, text) from public;
revoke all on function public.get_customer_inquiry_by_code(text, text, text) from public;
revoke all on function public.add_customer_inquiry_message(text, text, text, text) from public;
revoke all on function public.get_pending_inquiry_queue_count() from public;

grant execute on function public.get_pending_inquiry_queue_count() to anon, authenticated;
grant execute on function public.submit_customer_inquiry(text, text, text, text, text) to anon, authenticated;
grant execute on function public.get_customer_inquiry_by_code(text, text, text) to anon, authenticated;
grant execute on function public.add_customer_inquiry_message(text, text, text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- RLS: messages (admin direct access only)
-- -----------------------------------------------------------------------------
alter table public.customer_inquiry_messages enable row level security;

revoke all on table public.customer_inquiry_messages from anon;
grant select, insert on table public.customer_inquiry_messages to authenticated;

drop policy if exists "customer_inquiry_messages_select_authenticated" on public.customer_inquiry_messages;
drop policy if exists "customer_inquiry_messages_insert_authenticated" on public.customer_inquiry_messages;

create policy "customer_inquiry_messages_select_authenticated"
  on public.customer_inquiry_messages
  for select
  to authenticated
  using (true);

create policy "customer_inquiry_messages_insert_authenticated"
  on public.customer_inquiry_messages
  for insert
  to authenticated
  with check (sender in ('customer', 'admin'));

-- Revoke direct anon insert on inquiries (use RPC)
drop policy if exists "customer_inquiries_insert_anon" on public.customer_inquiries;

drop policy if exists "customer_inquiries_update_authenticated" on public.customer_inquiries;

create policy "customer_inquiries_update_authenticated"
  on public.customer_inquiries
  for update
  to authenticated
  using (true)
  with check (
    status in ('pending', 'in_progress', 'answered', 'closed')
    and type in ('shipping', 'exchange', 'refund', 'product', 'other')
  );

revoke insert on table public.customer_inquiries from anon;
