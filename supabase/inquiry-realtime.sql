-- =============================================================================
-- TWOTWOSHOP: Enable Supabase Realtime for inquiry chat
-- =============================================================================
-- Run after inquiry-chat-system.sql
-- Required for admin live message/list updates.
-- =============================================================================

alter publication supabase_realtime add table public.customer_inquiries;
alter publication supabase_realtime add table public.customer_inquiry_messages;
