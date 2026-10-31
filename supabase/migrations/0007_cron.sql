-- 0007_cron.sql : daily automated billing
create extension if not exists pg_cron;

-- Run billing every day at 02:00 UTC
select cron.schedule(
  'daily-billing',
  '0 2 * * *',
  $$select public.run_billing(current_date);$$
);

-- To remove later:
-- select cron.unschedule('daily-billing');
