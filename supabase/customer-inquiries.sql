-- =============================================================================
-- TWOTWOSHOP: Customer Additional Inquiries (상담 위젯 추가 문의)
-- =============================================================================
-- Run in Supabase SQL Editor after inquiry-management.sql (optional).
-- Stores only "추가 문의하기" submissions from the chat widget.
-- Auto-guide FAQ views are not stored.
-- =============================================================================

create table if not exists public.customer_inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_number text unique not null,
  name text not null,
  phone text not null,
  email text,
  type text not null
    check (type in ('shipping', 'exchange', 'refund', 'product', 'other')),
  message text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  admin_reply text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.customer_inquiries is
  '상담 위젯 추가 문의만 저장합니다. 자동 안내(FAQ) 조회는 저장하지 않습니다.';

comment on column public.customer_inquiries.type is
  'shipping=배송, exchange=교환, refund=환불, product=상품, other=기타/결제';

create index if not exists idx_customer_inquiries_status on public.customer_inquiries (status);
create index if not exists idx_customer_inquiries_type on public.customer_inquiries (type);
create index if not exists idx_customer_inquiries_created_at on public.customer_inquiries (created_at desc);
create index if not exists idx_customer_inquiries_phone on public.customer_inquiries (phone);

drop trigger if exists customer_inquiries_set_updated_at on public.customer_inquiries;

create trigger customer_inquiries_set_updated_at
  before update on public.customer_inquiries
  for each row
  execute function public.set_updated_at();

alter table public.customer_inquiries enable row level security;

revoke all on table public.customer_inquiries from anon;
revoke all on table public.customer_inquiries from authenticated;

grant insert on table public.customer_inquiries to anon, authenticated;
grant select, update on table public.customer_inquiries to authenticated;

drop policy if exists "customer_inquiries_insert_anon" on public.customer_inquiries;

create policy "customer_inquiries_insert_anon"
  on public.customer_inquiries
  for insert
  to anon, authenticated
  with check (
    type in ('shipping', 'exchange', 'refund', 'product', 'other')
    and status = 'pending'
  );

drop policy if exists "customer_inquiries_select_authenticated" on public.customer_inquiries;

create policy "customer_inquiries_select_authenticated"
  on public.customer_inquiries
  for select
  to authenticated
  using (true);

drop policy if exists "customer_inquiries_update_authenticated" on public.customer_inquiries;

create policy "customer_inquiries_update_authenticated"
  on public.customer_inquiries
  for update
  to authenticated
  using (true)
  with check (
    status in ('pending', 'in_progress', 'completed')
    and type in ('shipping', 'exchange', 'refund', 'product', 'other')
  );
