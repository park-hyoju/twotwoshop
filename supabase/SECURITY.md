# TWOTWOSHOP Supabase Security Runbook (P0)

## Apply NOW (production)

1. Open Supabase Dashboard → SQL Editor.
2. Paste and run **only** `supabase/p0-security-lockdown.sql` (or `migrations/20260715120000_p0_security_lockdown.sql`).
3. Then run **`supabase/admin-reset-test-orders.sql`** (admin test-order reset RPCs).
4. Confirm notices show `APPLIED` for products RLS, orders RLS, checkout RPC.
5. From the repo machine with `.env.local` pointing at production:

```bash
npm run test:security:live
```

Optional member/admin credentials:

```bash
ADMIN_TEST_PASSWORD=... \
MEMBER_A_EMAIL=... MEMBER_A_PASSWORD=... \
MEMBER_B_EMAIL=... MEMBER_B_PASSWORD=... \
npm run test:security:live
```

## Never run again

Everything under `supabase/legacy-sql-archive/` — especially:

- `admin-orders-rls.sql` — anon `using (true)` on orders
- `admin-products-rls.sql` — anon product CRUD
- `fix-product-detail-save-rls.sql` — open product writes
- `admin-route-guard.sql` — `is_admin()` via `user_profiles.role`
- `order-checkout-v2.sql` — trusts client prices
- `inquiry-management.sql` / `customer-management.sql` — any-authenticated PII

Also avoid re-running `order-items-product-options.sql` after lockdown (historical client `subtotal` trust).

## Safe historical hardening (already folded into P0 where relevant)

- `security-hardening-v3.sql` / `v4` / `v4-fix-consultation.sql`
- `production-security-rls.sql`
- `coupon-shipping-policy-v1.sql` (server price + free shipping; P0 RPC supersedes)

## Admin bootstrap

Admin requires **Auth `app_metadata.role = 'admin'`** (Dashboard or service-role script).  
Frontend no longer treats `user_profiles.role` as admin.
