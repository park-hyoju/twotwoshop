-- =============================================================================
-- TWOTWOSHOP: Inquiry read status (admin/customer unread tracking)
-- =============================================================================
-- Run after inquiry-image-attachments.sql
-- =============================================================================

alter table public.customer_inquiries
  add column if not exists admin_read_at timestamptz,
  add column if not exists customer_read_at timestamptz,
  add column if not exists admin_unread_count integer not null default 0;

alter table public.customer_inquiry_messages
  add column if not exists read_at timestamptz;

comment on column public.customer_inquiries.admin_read_at is
  '관리자가 상담 상세를 마지막으로 연 시각';

comment on column public.customer_inquiries.customer_read_at is
  '고객이 상담 대화방을 마지막으로 연 시각';

comment on column public.customer_inquiries.admin_unread_count is
  '관리자 미확인 고객 메시지 수';

-- Backfill: 기존 답변대기 문의는 미확인 1건으로 간주
update public.customer_inquiries
set admin_unread_count = greatest(admin_unread_count, 1)
where status in ('pending', 'in_progress')
  and admin_unread_count = 0;

-- -----------------------------------------------------------------------------
-- Trigger: 고객 메시지 시 관리자 미확인 카운트 증가
-- -----------------------------------------------------------------------------
create or replace function public.handle_customer_inquiry_message_unread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.sender = 'customer' then
    update public.customer_inquiries
    set admin_unread_count = admin_unread_count + 1,
        updated_at = now()
    where id = NEW.inquiry_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists customer_inquiry_messages_unread_trigger on public.customer_inquiry_messages;

create trigger customer_inquiry_messages_unread_trigger
  after insert on public.customer_inquiry_messages
  for each row
  execute function public.handle_customer_inquiry_message_unread();

-- -----------------------------------------------------------------------------
-- Admin: mark inquiry as read
-- -----------------------------------------------------------------------------
create or replace function public.mark_admin_inquiry_read(p_inquiry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.customer_inquiries
  set admin_read_at = now(),
      admin_unread_count = 0
  where id = p_inquiry_id;
end;
$$;

revoke all on function public.mark_admin_inquiry_read(uuid) from public;
grant execute on function public.mark_admin_inquiry_read(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Customer: mark inquiry as read (identity verified)
-- -----------------------------------------------------------------------------
create or replace function public.mark_customer_inquiry_read(
  p_inquiry_id uuid,
  p_name text,
  p_phone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.customer_inquiries
  set customer_read_at = now()
  where id = p_inquiry_id
    and trim(name) = trim(p_name)
    and public.normalize_inquiry_phone(phone) = public.normalize_inquiry_phone(p_phone);
end;
$$;

revoke all on function public.mark_customer_inquiry_read(uuid, text, text) from public;
grant execute on function public.mark_customer_inquiry_read(uuid, text, text) to anon, authenticated;
