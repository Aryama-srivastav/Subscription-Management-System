-- Optional seed data (run after creating an admin user and promoting role)
insert into public.products (name, type, sales_price, cost_price, notes) values
  ('Brightloop Core', 'software', 49.00, 10.00, 'Core subscription software'),
  ('Analytics Add-on', 'addon', 19.00, 4.00, 'Usage analytics'),
  ('Seats Pack', 'variant', 560.00, 100.00, 'Per-seat variant (Odoo brand +560)')
on conflict do nothing;

insert into public.plans (name, cost, billing_frequency, min_qty) values
  ('Monthly Starter', 49.00, 'monthly', 1),
  ('Yearly Pro', 490.00, 'yearly', 5)
on conflict do nothing;

insert into public.taxes (name, rate_percent) values
  ('GST', 18.00),
  ('VAT', 20.00)
on conflict do nothing;
