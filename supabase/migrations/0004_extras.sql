-- 0004_extras.sql : variants, quotation templates, discounts

create table if not exists public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price_delta numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.subscription_lines add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
alter table public.invoice_lines add column if not exists variant_id uuid references public.product_variants(id) on delete set null;

create table if not exists public.quotation_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan_id uuid references public.plans(id) on delete set null,
  validity_days integer not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists public.quotation_template_lines (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references public.quotation_templates(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  qty numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0
);

create table if not exists public.discounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('fixed','percentage')),
  value numeric(12,2) not null default 0,
  min_purchase numeric(12,2) not null default 0,
  min_qty numeric(12,2) not null default 0,
  start_date date,
  end_date date,
  usage_limit integer,
  used_count integer not null default 0,
  scope text not null default 'all' check (scope in ('product','subscription','all')),
  product_id uuid references public.products(id) on delete set null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_discounts (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  discount_id uuid references public.discounts(id) on delete set null,
  amount numeric(12,2) not null default 0
);

create index if not exists idx_variants_product on public.product_variants(product_id);
create index if not exists idx_qt_plan on public.quotation_templates(plan_id);
create index if not exists idx_discounts_product on public.discounts(product_id);
create index if not exists idx_invoice_discounts_invoice on public.invoice_discounts(invoice_id);
