# Legacy SQL archive — DO NOT RUN

These files are kept for historical reference only.

Re-running them can reopen **anon/authenticated using (true)** policies,
reintroduce **client-trusted checkout prices**, or make **`is_admin()` trust
`user_profiles.role`** (privilege escalation).

## Canonical production fix

Run **`../p0-security-lockdown.sql`** in the Supabase SQL Editor instead.

See **`../SECURITY.md`**.
