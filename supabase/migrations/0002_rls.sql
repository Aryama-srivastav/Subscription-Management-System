create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff'));
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.plans enable row level security;
alter table public.taxes enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_lines enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.payments enable row level security;

create policy "profiles self read" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "profiles admin write" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "products read" on public.products for select using (true);
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "plans read" on public.plans for select using (true);
create policy "plans admin write" on public.plans for all using (public.is_admin()) with check (public.is_admin());

create policy "taxes read" on public.taxes for select using (true);
create policy "taxes admin write" on public.taxes for all using (public.is_admin()) with check (public.is_admin());

create policy "subs read" on public.subscriptions for select using (customer_id = auth.uid() or public.is_staff());
create policy "subs staff write" on public.subscriptions for all using (public.is_staff()) with check (public.is_staff());

create policy "sublines read" on public.subscription_lines for select using (
  exists (select 1 from public.subscriptions s where s.id = subscription_id and (s.customer_id = auth.uid() or public.is_staff()))
);
create policy "sublines staff write" on public.subscription_lines for all using (public.is_staff()) with check (public.is_staff());

create policy "invoices read" on public.invoices for select using (customer_id = auth.uid() or public.is_staff());
create policy "invoices staff write" on public.invoices for all using (public.is_staff()) with check (public.is_staff());

create policy "invlines read" on public.invoice_lines for select using (
  exists (select 1 from public.invoices i where i.id = invoice_id and (i.customer_id = auth.uid() or public.is_staff()))
);
create policy "invlines staff write" on public.invoice_lines for all using (public.is_staff()) with check (public.is_staff());

create policy "payments read" on public.payments for select using (
  exists (select 1 from public.invoices i where i.id = invoice_id and (i.customer_id = auth.uid() or public.is_staff()))
);
create policy "payments staff write" on public.payments for all using (public.is_staff()) with check (public.is_staff());
