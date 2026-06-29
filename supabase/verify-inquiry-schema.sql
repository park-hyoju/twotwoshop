-- =============================================================================
-- TWOTWOSHOP: Verify inquiry schema for admin 상담관리
-- =============================================================================
-- Run in Supabase SQL Editor to confirm tables/columns/RLS exist.
-- =============================================================================

-- Tables
select
  table_name,
  case when table_name is not null then 'ok' else 'missing' end as status
from information_schema.tables
where table_schema = 'public'
  and table_name in ('customer_inquiries', 'customer_inquiry_messages')
order by table_name;

-- customer_inquiries columns
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'customer_inquiries'
  and column_name in (
    'id',
    'inquiry_number',
    'inquiry_code',
    'name',
    'phone',
    'email',
    'type',
    'status',
    'message',
    'admin_reply',
    'admin_note',
    'image_urls',
    'order_reference',
    'created_at',
    'updated_at'
  )
order by column_name;

-- customer_inquiry_messages columns
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'customer_inquiry_messages'
  and column_name in ('id', 'inquiry_id', 'sender', 'message', 'image_urls', 'created_at')
order by column_name;

-- RLS enabled
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('customer_inquiries', 'customer_inquiry_messages');

-- Policies for authenticated SELECT
select schemaname, tablename, policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('customer_inquiries', 'customer_inquiry_messages')
  and cmd in ('SELECT', 'ALL')
order by tablename, policyname;

-- Sample row count (admin should see this via authenticated session)
select count(*) as customer_inquiries_count from public.customer_inquiries;
select count(*) as customer_inquiry_messages_count from public.customer_inquiry_messages;
