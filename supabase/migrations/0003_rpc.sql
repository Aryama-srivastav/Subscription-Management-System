create or replace function public.run_billing(p_as_of date default current_date)
returns json language plpgsql security definer as $$
declare
  v_sub record;
  v_inv uuid;
  v_count int := 0;
  v_skipped int := 0;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  for v_sub in
    select s.* from public.subscriptions s
    where s.status in ('active','confirmed')
      and (s.next_billing_date is null or s.next_billing_date <= p_as_of)
  loop
    if exists (select 1 from public.invoices where subscription_id = v_sub.id and billing_period_start = coalesce(v_sub.next_billing_date, v_sub.start_date)) then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    insert into public.invoices (subscription_id, customer_id, issue_date, due_date, status, subtotal, tax_total, total, balance, billing_period_start)
    values (v_sub.id, v_sub.customer_id, p_as_of, p_as_of + interval '30 days', 'draft', 0, 0, 0, 0, coalesce(v_sub.next_billing_date, v_sub.start_date))
    returning id into v_inv;
    insert into public.invoice_lines (invoice_id, product_id, qty, unit_price, tax_rate, tax_amount, line_total)
    select v_inv, sl.product_id, sl.qty, sl.unit_price, sl.tax_rate, sl.tax_amount,
           sl.line_amount + sl.tax_amount
    from public.subscription_lines sl
    where sl.subscription_id = v_sub.id;
    update public.invoices i set
      subtotal = coalesce((select sum(line_amount) from public.subscription_lines where subscription_id = v_sub.id),0),
      tax_total = coalesce((select sum(tax_amount) from public.subscription_lines where subscription_id = v_sub.id),0)
    where i.id = v_inv;
    update public.invoices set total = subtotal + tax_total, balance = subtotal + tax_total where id = v_inv;
    update public.subscriptions set
      next_billing_date = case billing_frequency
        when 'daily' then coalesce(next_billing_date, start_date) + interval '1 day'
        when 'weekly' then coalesce(next_billing_date, start_date) + interval '7 days'
        when 'monthly' then coalesce(next_billing_date, start_date) + interval '1 month'
        when 'yearly' then coalesce(next_billing_date, start_date) + interval '1 year'
      end
    where id = v_sub.id;
    v_count := v_count + 1;
  end loop;
  return json_build_object('created', v_count, 'skipped', v_skipped);
end;
$$;

grant execute on function public.run_billing(date) to authenticated;
