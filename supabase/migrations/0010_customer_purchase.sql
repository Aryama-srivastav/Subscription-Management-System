-- 0010_customer_purchase.sql
create or replace function public.customer_purchase(p_plan_id uuid, p_items jsonb)
returns uuid language plpgsql security definer as $$
declare
  v_uid uuid := auth.uid();
  v_plan public.plans%rowtype;
  v_sub uuid;
  v_inv uuid;
  v_item jsonb;
  v_prod public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_qty numeric;
  v_price numeric;
  v_tax_rate numeric := 0;
  v_subtotal numeric := 0;
  v_taxtotal numeric := 0;
  v_discount numeric := 0;
  v_total numeric := 0;
  v_d record;
  v_applicable numeric;
  v_today date := current_date;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.profiles where id=v_uid and role='customer') then
    raise exception 'customers only';
  end if;
  select * into v_plan from public.plans where id=p_plan_id and is_active=true;
  if not found then raise exception 'plan not found'; end if;

  -- default tax rate (first active)
  select rate_percent into v_tax_rate from public.taxes where is_active=true order by created_at limit 1;
  if v_tax_rate is null then v_tax_rate := 0; end if;

  insert into public.subscriptions (customer_id, plan_id, start_date, expiry_date, payment_terms, status, next_billing_date, created_by)
  values (v_uid, p_plan_id, v_today,
          case v_plan.billing_frequency
            when 'daily' then v_today + interval '1 day'
            when 'weekly' then v_today + interval '7 days'
            when 'monthly' then v_today + interval '1 month'
            when 'yearly' then v_today + interval '1 year'
          end,
          'Net 30', 'active', v_today, v_uid)
  returning id into v_sub;

  update public.subscriptions set number = 'SUB-' || substr(v_sub::text,1,8) where id=v_sub;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::numeric;
    if v_qty is null or v_qty < 1 then v_qty := 1; end if;
    select * into v_prod from public.products where id=(v_item->>'product_id')::uuid and is_active=true;
    if not found then continue; end if;
    v_price := v_prod.sales_price;
    if (v_item->>'variant_id') is not null and (v_item->>'variant_id') <> '' then
      select * into v_variant from public.product_variants where id=(v_item->>'variant_id')::uuid;
      if found then v_price := v_price + v_variant.price_delta; end if;
    end if;
    insert into public.subscription_lines (subscription_id, product_id, variant_id, qty, unit_price, tax_rate, tax_amount, line_amount)
    values (v_sub, v_prod.id,
            nullif(v_item->>'variant_id','')::uuid,
            v_qty, v_price, v_tax_rate,
            round(v_qty * v_price * v_tax_rate / 100, 2),
            v_qty * v_price);
    v_subtotal := v_subtotal + (v_qty * v_price);
    v_taxtotal := v_taxtotal + round(v_qty * v_price * v_tax_rate / 100, 2);
  end loop;

  -- create invoice
  insert into public.invoices (subscription_id, customer_id, issue_date, due_date, status, subtotal, tax_total, total, balance, billing_period_start)
  values (v_sub, v_uid, v_today, v_today + interval '30 days', 'draft', v_subtotal, v_taxtotal, 0, 0, v_today)
  returning id into v_inv;
  update public.invoices set number = 'INV-' || substr(v_inv::text,1,8) where id=v_inv;

  insert into public.invoice_lines (invoice_id, product_id, variant_id, qty, unit_price, tax_rate, tax_amount, line_total)
  select v_inv, sl.product_id, sl.variant_id, sl.qty, sl.unit_price, sl.tax_rate, sl.tax_amount, sl.line_amount + sl.tax_amount
  from public.subscription_lines sl where sl.subscription_id=v_sub;

  -- apply active discounts
  for v_d in
    select * from public.discounts
    where is_active=true and (start_date is null or start_date <= v_today) and (end_date is null or end_date >= v_today)
      and (usage_limit is null or used_count < usage_limit)
  loop
    if v_d.scope='product' and v_d.product_id is not null then
      select coalesce(sum(sl.line_amount),0) into v_applicable
      from public.subscription_lines sl
      where sl.subscription_id=v_sub and sl.product_id=v_d.product_id;
    else
      v_applicable := v_subtotal;
    end if;
    if v_d.min_purchase>0 and v_subtotal < v_d.min_purchase then v_applicable := 0; end if;
    if v_d.min_qty>0 and (select coalesce(sum(qty),0) from public.subscription_lines where subscription_id=v_sub) < v_d.min_qty then v_applicable := 0; end if;
    if v_applicable>0 then
      declare v_amt numeric;
      begin
        if v_d.type='percentage' then v_amt := v_applicable*(v_d.value/100); else v_amt := v_d.value; end if;
        if v_amt > v_applicable then v_amt := v_applicable; end if;
        if v_amt>0 then
          insert into public.invoice_discounts (invoice_id, discount_id, amount) values (v_inv, v_d.id, v_amt);
          update public.discounts set used_count=used_count+1 where id=v_d.id;
          v_discount := v_discount + v_amt;
        end if;
      end;
    end if;
  end loop;

  v_total := v_subtotal + v_taxtotal - v_discount;
  if v_total < 0 then v_total := 0; end if;
  update public.invoices set total=v_total, balance=v_total where id=v_inv;

  -- advance next billing
  update public.subscriptions set
    next_billing_date = case v_plan.billing_frequency
      when 'daily' then v_today + interval '1 day'
      when 'weekly' then v_today + interval '7 days'
      when 'monthly' then v_today + interval '1 month'
      when 'yearly' then v_today + interval '1 year'
    end
  where id=v_sub;

  return v_inv;
end;
$$;
grant execute on function public.customer_purchase(uuid, jsonb) to authenticated;
