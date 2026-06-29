-- =============================================================================
-- TWOTWOSHOP: Admin delete for customer inquiries
-- =============================================================================
-- Run after inquiry-chat-system.sql
-- Messages cascade-delete via FK on customer_inquiry_messages.inquiry_id
-- =============================================================================

grant delete on table public.customer_inquiries to authenticated;

drop policy if exists customer_inquiries_delete_authenticated on public.customer_inquiries;

create policy customer_inquiries_delete_authenticated
  on public.customer_inquiries
  for delete
  to authenticated
  using (true);
