-- 0006: billing RPC with discount auto-apply
create or replace function public.run_billing(p_as_of date default current_date)
returns json language plpgsql security definer as $$
declare
  v_sub record;
  v_inv uuid;
  v_count int := 0;
  v_skipped int := 0;
  v_subtotal numeric := 0;
  v_taxtotal numeric := 0;
  v_discount numeric := 0;
  v_total numeric := 0;
  v_d record;
  v_applicable numeric := 0;
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
    -- subtotal/tax from subscription lines
    select coalesce(sum(line_amount),0), coalesce(sum(tax_amount),0)
      into v_subtotal, v_taxtotal
      from public.subscription_lines where subscription_id = v_sub.id;

    insert into public.invoices (subscription_id, customer_id, issue_date, due_date, status, subtotal, tax_total, total, balance, billing_period_start)
    values (v_sub.id, v_sub.customer_id, p_as_of, p_as_of + interval '30 days', 'draft', v_subtotal, v_taxtotal, 0, 0, coalesce(v_sub.next_billing_date, v_sub.start_date))
    returning id into v_inv;

    insert into public.invoice_lines (invoice_id, product_id, variant_id, qty, unit_price, tax_rate, tax_amount, line_total)
    select v_inv, sl.product_id, sl.variant_id, sl.qty, sl.unit_price, sl.tax_rate, sl.tax_amount,
           sl.line_amount + sl.tax_amount
    from public.subscription_lines sl
    where sl.subscription_id = v_sub.id;

    -- apply active discounts
    v_discount := 0;
    for v_d in
      select * from public.discounts
      where is_active = true
        and (start_date is null or start_date <= p_as_of)
        and (end_date is null or end_date >= p_as_of)
        and (usage_limit is null or used_count < usage_limit)
    loop
      -- determine applicable subtotal
      if v_d.scope = 'product' and v_d.product_id is not null then
        select coalesce(sum(sl.line_amount),0) into v_applicable
        from public.subscription_lines sl
        where sl.subscription_id = v_sub.id and sl.product_id = v_d.product_id;
      else
        v_applicable := v_subtotal;
      end if;
      if v_d.min_purchase > 0 and v_subtotal < v_d.min_purchase then
        v_applicable := 0;
      end if;
      if v_d.min_qty > 0 then
        -- check total qty
        if (select coalesce(sum(qty),0) from public.subscription_lines where subscription_id = v_sub.id) < v_d.min_qty then
          v_applicable := 0;
        end if;
      end if;
      if v_applicable > 0 then
        declare v_amt numeric;
        begin
          if v_d.type = 'percentage' then v_amt := v_applicable * (v_d.value/100);
          else v_amt := v_d.value;
          end if;
          if v_amt > v_applicable then v_amt := v_applicable; end if;
          if v_amt > 0 then
            insert into public.invoice_discounts (invoice_id, discount_id, amount) values (v_inv, v_d.id, v_amt);
            v_discount := v_discount + v_amt;
            update public.discounts set used_count = used_count + 1 where id = v_d.id;
          end if;
        end;
      end if;
    end loop;

    v_total := v_subtotal + v_taxtotal - v_discount;
    if (v_total < 0) then v_total := 0; end if;
    update public.invoices set total = v_total, balance = v_total, tax_total = v_taxtotal, subtotal = v_subtotal where id = v_inv;

    -- advance next_billing_date
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
