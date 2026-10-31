-- 0008_customer_portal.sql : customer self-service
-- Allow a customer to close their own subscription only when the plan permits early close.
create policy "subs customer close" on public.subscriptions
  for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid() and status = 'closed');

-- Note: application layer must also verify plans.allow_early_close before allowing the action.
