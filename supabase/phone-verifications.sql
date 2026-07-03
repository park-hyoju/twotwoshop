-- =============================================================================
-- phone_verifications — 휴대폰 인증 기반 비밀번호 찾기
-- Edge Function secrets (Supabase Dashboard → Project Settings → Edge Functions):
--   SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER_NUMBER
--   PHONE_VERIFICATION_SECRET (optional, code hashing pepper)
-- When SOLAPI_* vars are missing, functions log the code to the console (mock mode).
-- Deploy:
--   supabase functions deploy phone-password-reset-send
--   supabase functions deploy phone-password-reset-verify
--   supabase functions deploy phone-password-reset-complete
-- =============================================================================

create table if not exists public.phone_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phone text not null,
  purpose text not null default 'password_reset',
  code_hash text not null,
  attempt_count int not null default 0,
  blocked_at timestamptz,
  expires_at timestamptz not null,
  verified_at timestamptz,
  used_at timestamptz,
  reset_token_hash text,
  reset_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint phone_verifications_purpose_check
    check (purpose in ('password_reset')),
  constraint phone_verifications_attempt_count_check
    check (attempt_count >= 0)
);

create index if not exists phone_verifications_user_id_created_at_idx
  on public.phone_verifications (user_id, created_at desc);

create index if not exists phone_verifications_expires_at_idx
  on public.phone_verifications (expires_at);

comment on table public.phone_verifications is
  'SMS verification codes for password reset. Managed by Edge Functions only.';

alter table public.phone_verifications enable row level security;

revoke all on table public.phone_verifications from anon, authenticated, public;

-- -----------------------------------------------------------------------------
-- Member lookup for password reset (Edge Function / service role)
-- -----------------------------------------------------------------------------
create or replace function public.lookup_member_for_password_reset(p_identifier text)
returns table (
  user_id uuid,
  phone_digits text
)
language sql
security definer
set search_path = public, auth
stable
as $$
  with normalized as (
    select
      lower(trim(p_identifier)) as login_id,
      regexp_replace(trim(p_identifier), '\D', '', 'g') as digits
  )
  select
    p.id as user_id,
    regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') as phone_digits
  from public.user_profiles p
  inner join auth.users u on u.id = p.id
  cross join normalized n
  where coalesce(u.raw_app_meta_data->>'role', '') <> 'admin'
    and regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') ~ '^01[0-9]{8,9}$'
    and (
      (n.login_id <> '' and lower(coalesce(p.login_id, '')) = n.login_id)
      or (
        n.digits ~ '^01[0-9]{8,9}$'
        and regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') = n.digits
      )
    )
  order by p.updated_at desc nulls last
  limit 1;
$$;

revoke all on function public.lookup_member_for_password_reset(text) from public;
grant execute on function public.lookup_member_for_password_reset(text) to service_role;
