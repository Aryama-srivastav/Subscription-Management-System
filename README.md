# Subscription Management System (Brightloop)

Core MVP: auth + roles, products, plans, taxes, subscriptions, invoices, payments, dashboard.

## Setup

### 1. Supabase
1. Create a Supabase project (or use existing).
2. Run SQL in order from `supabase/migrations/`:
   - `0001_schema.sql`
   - `0002_rls.sql`
   - `0003_rpc.sql`
3. (Optional) Run `supabase/seed.sql`.
4. Promote your first user to admin:
   ```sql
   update public.profiles set role='admin' where email='you@example.com';
   ```

### 2. Frontend
```bash
cp .env.example .env
# fill VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open http://localhost:5173

### Roles
- Admin: full control, manage products/plans/taxes, run billing, delete.
- Staff: day-to-day operations.
- Customer: sees own subscriptions/invoices.

### Billing
Admin → Subscriptions → "Run billing" (as-of date). Idempotent via unique (subscription, period).

### Tests
```bash
npm test
```

