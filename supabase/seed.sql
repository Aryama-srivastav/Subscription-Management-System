-- Demo seed data
insert into public.products (name, type, sales_price, cost_price, notes) values
  ('Brightloop Core', 'software', 49.00, 10.00, 'Core subscription software'),
  ('Analytics Add-on', 'addon', 19.00, 4.00, 'Usage analytics'),
  ('Seats Pack', 'variant', 560.00, 100.00, 'Per-seat variant (Odoo brand +560)'),
  ('Support Plan', 'software', 29.00, 5.00, 'Priority support'),
  ('Storage Boost', 'addon', 9.00, 2.00, 'Extra storage')
on conflict do nothing;

insert into public.plans (name, cost, billing_frequency, min_qty, available_from, available_to, auto_close, allow_pause, allow_renew, allow_early_close) values
  ('Monthly Starter', 49.00, 'monthly', 1, current_date, null, false, true, true, true),
  ('Yearly Pro', 490.00, 'yearly', 5, current_date, null, false, true, true, true),
  ('Weekly Trial', 5.00, 'weekly', 1, current_date, null, true, false, true, true)
on conflict do nothing;

insert into public.taxes (name, rate_percent) values
  ('GST', 18.00),
  ('VAT', 20.00)
on conflict do nothing;

insert into public.product_variants (product_id, name, price_delta)
select id, 'Odoo brand', 560 from public.products where name='Seats Pack'
on conflict do nothing;

insert into public.discounts (name, type, value, min_purchase, min_qty, start_date, end_date, usage_limit, scope, is_active)
values
  ('Launch 10%', 'percentage', 10, 0, 0, current_date, current_date + interval '90 days', 100, 'all', true),
  ('Bulk seats', 'fixed', 50, 500, 5, current_date, null, null, 'product', true)
on conflict do nothing;
update public.discounts set product_id = (select id from public.products where name='Seats Pack') where name='Bulk seats';

insert into public.quotation_templates (name, plan_id, validity_days)
select 'Enterprise offer', id, 30 from public.plans where name='Yearly Pro' limit 1
on conflict do nothing;

