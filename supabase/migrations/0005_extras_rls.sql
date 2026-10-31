alter table public.product_variants enable row level security;
alter table public.quotation_templates enable row level security;
alter table public.quotation_template_lines enable row level security;
alter table public.discounts enable row level security;
alter table public.invoice_discounts enable row level security;

create policy "variants read" on public.product_variants for select using (true);
create policy "variants admin write" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

create policy "qt read" on public.quotation_templates for select using (public.is_staff());
create policy "qt staff write" on public.quotation_templates for all using (public.is_staff()) with check (public.is_staff());

create policy "qtl read" on public.quotation_template_lines for select using (public.is_staff());
create policy "qtl staff write" on public.quotation_template_lines for all using (public.is_staff()) with check (public.is_staff());

create policy "discounts read" on public.discounts for select using (public.is_staff());
create policy "discounts admin write" on public.discounts for all using (public.is_admin()) with check (public.is_admin());

create policy "invdisc read" on public.invoice_discounts for select using (
  exists (select 1 from public.invoices i where i.id = invoice_id and (i.customer_id = auth.uid() or public.is_staff()))
);
create policy "invdisc staff write" on public.invoice_discounts for all using (public.is_staff()) with check (public.is_staff());
