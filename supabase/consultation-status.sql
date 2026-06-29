-- =============================================================================
-- TWOTWOSHOP: Admin-managed consultation availability status
-- =============================================================================
-- Run after customer-inquiries.sql
-- Enables realtime status display on customer chat widget.
-- =============================================================================

create table if not exists public.consultation_status_settings (
  id text primary key default 'default' check (id = 'default'),
  status text not null default 'available'
    check (status in ('available', 'away', 'busy', 'closed')),
  updated_at timestamptz not null default now()
);

comment on table public.consultation_status_settings is
  '관리자가 설정하는 실시간 상담 가능 상태 (싱글톤 행)';

insert into public.consultation_status_settings (id, status)
values ('default', 'available')
on conflict (id) do nothing;

drop trigger if exists consultation_status_settings_set_updated_at on public.consultation_status_settings;

create trigger consultation_status_settings_set_updated_at
  before update on public.consultation_status_settings
  for each row
  execute function public.set_updated_at();

alter table public.consultation_status_settings enable row level security;

grant select on table public.consultation_status_settings to anon, authenticated;
grant update on table public.consultation_status_settings to authenticated;

drop policy if exists consultation_status_settings_select_all on public.consultation_status_settings;

create policy consultation_status_settings_select_all
  on public.consultation_status_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists consultation_status_settings_update_authenticated on public.consultation_status_settings;

create policy consultation_status_settings_update_authenticated
  on public.consultation_status_settings
  for update
  to authenticated
  using (true)
  with check (
    status in ('available', 'away', 'busy', 'closed')
  );

-- Realtime (run inquiry-realtime.sql first if publication exists)
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    execute 'alter publication supabase_realtime add table public.consultation_status_settings';
  end if;
exception
  when duplicate_object then null;
end $$;
