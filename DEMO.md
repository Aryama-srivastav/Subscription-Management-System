# Demo script (for video)

## Setup (once)
1. Run migrations 0001–0010 + seed.sql in Supabase.
2. Promote admin: `update public.profiles set role='admin' where email='admin@demo.com';`
3. Create a customer account via Sign up: `customer@demo.com`.
4. `npm run dev`.

## 60–90s walkthrough
1. **Login as admin** → show Dashboard (metrics).
2. **Products** → create/edit product, add variant "Odoo brand +560".
3. **Plans** → show monthly/yearly, auto-close toggle.
4. **Discounts** → show "Launch 10%".
5. **Quotations** → create template, then "Create subscription from this".
6. **Subscriptions** → show status flow (Draft→Quotation→Confirmed→Active), generate invoice.
7. **Invoice detail** → discount auto-applied, record payment → status Paid.
8. **Payments** page → list.
9. **Run billing** button → creates invoices idempotently.
10. **Logout → login as customer** → Catalog → buy product → invoice → pay.
11. Customer portal → view own subscriptions/invoices.

## Win tips
- Use seed data so the app is never empty.
- Show the bright theme and responsive layout.
- Mention <2s page loads and RLS security.
- Show automated billing (pg_cron) and email notification.
