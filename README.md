# Subscription Management System (Brightloop)

Core MVP + extras (variants, quotations, discounts) + automated billing & email.

## Setup

### 1. Supabase
1. Create a Supabase project (or use existing).
2. Run SQL in order from `supabase/migrations/`:
   - `0001_schema.sql`
   - `0002_rls.sql`
   - `0003_rpc.sql`
   - `0004_extras.sql`
   - `0005_extras_rls.sql`
   - `0006_billing_discounts.sql`
   - `0007_cron.sql`
3. (Optional) Run `supabase/seed.sql`.
4. Promote your first user to admin:
   ```sql
   update public.profiles set role='admin' where email='you@example.com';
   ```

### 2. Email (Resend) for invoice notifications
1. Create a Resend account and API key.
2. Deploy the edge function:
   ```bash
   supabase functions deploy send-invoice-email
   ```
3. Set secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_URL=https://<ref>.supabase.co
   ```
4. In Supabase Dashboard → Database → Webhooks, create a webhook on `public.invoices` (INSERT) pointing to:
   `https://<ref>.supabase.co/functions/v1/send-invoice-email`
   with header `Authorization: Bearer <service_role_key>` and body `{ "invoice_id": "{{ record.id }}" }`.

### 3. Frontend
```bash
cp .env.example .env
# fill VITE_SUPABASE_ANON_KEY (publishable key)
npm install
npm run dev
```

Open http://localhost:5173

### Automated billing
`pg_cron` runs `public.run_billing(current_date)` daily at 02:00 UTC. Manual trigger also available in the app (Subscriptions → Run billing).

### Roles
- Admin: full control.
- Staff: day-to-day operations.
- Customer: sees own subscriptions/invoices.

### Tests
```bash
npm test
```

