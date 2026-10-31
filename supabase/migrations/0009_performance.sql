-- 0009_performance.sql : dashboard aggregates + extra indexes
create or replace function public.get_dashboard_stats()
returns json language sql stable security definer as $$
  select json_build_object(
    'activeSubs', (select count(*) from public.subscriptions where status='active'),
    'totalInvoiced', (select coalesce(sum(total),0) from public.invoices),
    'totalPaid', (select coalesce(sum(amount_paid),0) from public.invoices),
    'outstanding', (select coalesce(sum(balance),0) from public.invoices),
    'overdue', (select count(*) from public.invoices where status not in ('paid','cancelled') and due_date < current_date),
    'invoiceCount', (select count(*) from public.invoices)
  );
$$;
grant execute on function public.get_dashboard_stats() to authenticated;

create index if not exists idx_profiles_full_name on public.profiles(full_name);
create index if not exists idx_products_name on public.products(name);
create index if not exists idx_invoices_created on public.invoices(created_at);
