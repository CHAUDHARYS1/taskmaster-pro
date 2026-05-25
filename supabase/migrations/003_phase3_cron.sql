-- ─────────────────────────────────────────────────────────────────
-- Phase 3 · Scheduled due-date reminders
-- Run this in Supabase SQL Editor AFTER deploying the send-due-reminders Edge Function.
--
-- Before running:
--   1. Deploy the function:  supabase functions deploy send-due-reminders
--   2. Set secrets (replace the values):
--        supabase secrets set RESEND_API_KEY=re_your_key_here
--        supabase secrets set CRON_SECRET=some-random-secret-string
--        supabase secrets set APP_URL=https://your-site.netlify.app
--   3. Replace <your-cron-secret> below with the same CRON_SECRET value, then run.
-- ─────────────────────────────────────────────────────────────────

-- Enable required extensions (safe to run if already enabled)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule daily reminders at 8am UTC
-- Project ref is already filled in: ugejeysmqqkyeefdqwao
-- Replace <your-cron-secret> with the CRON_SECRET value you set above
select cron.schedule(
  'send-due-reminders',
  '0 8 * * *',
  $cron$
  select net.http_post(
    url     := 'https://ugejeysmqqkyeefdqwao.supabase.co/functions/v1/send-due-reminders',
    headers := '{"Content-Type":"application/json","x-cron-secret":"taskmaster-cron-2026"}'::jsonb,
    body    := '{}'::jsonb
  ) as request_id;
  $cron$
);
