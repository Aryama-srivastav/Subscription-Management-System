create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'customer' check (role in ('admin','staff','customer')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null default 'software',
  sales_price numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cost numeric(12,2) not null default 0,
  billing_frequency text not null default 'monthly' check (billing_frequency in ('daily','weekly','monthly','yearly')),
  min_qty integer not null default 1,
  available_from date,
  available_to date,
  auto_close boolean not null default false,
  allow_pause boolean not null default true,
  allow_renew boolean not null default true,
  allow_early_close boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.taxes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  rate_percent numeric(6,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  number text unique,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  start_date date not null,
  expiry_date date,
  payment_terms text,
  status text not null default 'draft' check (status in ('draft','quotation','confirmed','active','closed')),
  next_billing_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_lines (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  qty numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_rate numeric(6,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  line_amount numeric(12,2) not null default 0
);

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  number text unique,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  issue_date date not null,
  due_date date,
  status text not null default 'draft' check (status in ('draft','confirmed','paid','cancelled')),
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  billing_period_start date,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists invoices_sub_period_uidx
  on public.invoices (subscription_id, billing_period_start)
  where subscription_id is not null and billing_period_start is not null;

create table if not exists public.invoice_lines (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  qty numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_rate numeric(6,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0
);

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  method text not null,
  amount numeric(12,2) not null,
  paid_on date not null,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_customer on public.subscriptions(customer_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_next_billing on public.subscriptions(next_billing_date);
create index if not exists idx_invoices_customer on public.invoices(customer_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_due on public.invoices(due_date);
create index if not exists idx_invoice_lines_invoice on public.invoice_lines(invoice_id);
create index if not exists idx_subscription_lines_sub on public.subscription_lines(subscription_id);
