-- =============================================================================
-- TWOTWOSHOP: Inquiry Management MVP (상담관리)
-- =============================================================================
-- Run in Supabase SQL Editor after schema.sql / admin auth setup.
-- Creates inquiries table with admin-only read/update RLS.
-- Guest chat submissions may INSERT via anon (no SELECT).
-- =============================================================================

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_number text unique not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  inquiry_type text not null
    check (inquiry_type in ('shipping', 'exchange', 'refund', 'product', 'other')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  message text not null,
  admin_reply text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.inquiries is
  '1:1 고객 문의. 관리자 상담관리 화면에서 조회/답변합니다.';

comment on column public.inquiries.inquiry_type is
  'shipping=배송, exchange=교환, refund=환불, product=상품, other=기타';

comment on column public.inquiries.status is
  'pending=답변대기, in_progress=답변중, completed=답변완료';

comment on column public.inquiries.admin_reply is
  '고객에게 전달하는 관리자 답변 내용';

comment on column public.inquiries.admin_note is
  '내부 관리용 메모 (고객 비노출)';

create index if not exists idx_inquiries_status on public.inquiries (status);
create index if not exists idx_inquiries_inquiry_type on public.inquiries (inquiry_type);
create index if not exists idx_inquiries_created_at on public.inquiries (created_at desc);
create index if not exists idx_inquiries_customer_phone on public.inquiries (customer_phone);

drop trigger if exists inquiries_set_updated_at on public.inquiries;

create trigger inquiries_set_updated_at
  before update on public.inquiries
  for each row
  execute function public.set_updated_at();

alter table public.inquiries enable row level security;

revoke all on table public.inquiries from anon;
revoke all on table public.inquiries from authenticated;

grant insert on table public.inquiries to anon, authenticated;
grant select, update on table public.inquiries to authenticated;

-- Guest chat / storefront may submit inquiries (no read access)
drop policy if exists "inquiries_insert_anon" on public.inquiries;

create policy "inquiries_insert_anon"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (
    inquiry_type in ('shipping', 'exchange', 'refund', 'product', 'other')
    and status = 'pending'
  );

-- Admin (authenticated) full read
drop policy if exists "inquiries_select_authenticated" on public.inquiries;

create policy "inquiries_select_authenticated"
  on public.inquiries
  for select
  to authenticated
  using (true);

-- Admin (authenticated) update reply, memo, status
drop policy if exists "inquiries_update_authenticated" on public.inquiries;

create policy "inquiries_update_authenticated"
  on public.inquiries
  for update
  to authenticated
  using (true)
  with check (
    status in ('pending', 'in_progress', 'completed')
    and inquiry_type in ('shipping', 'exchange', 'refund', 'product', 'other')
  );
