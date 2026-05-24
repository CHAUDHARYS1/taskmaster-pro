-- ─────────────────────────────────────────────────────────────────
-- Phase 3 · Scheduled due-date reminders
-- Run this in Supabase SQL Editor AFTER deploying the send-due-reminders Edge Function.
--
-- Before running:
--   1. Deploy the function:  supabase functions deploy send-due-reminders
--   2. Set secrets:
--        supabase secrets set RESEND_API_KEY=<your-resend-key>
--        supabase secrets set CRON_SECRET=<any-random-string>
--        supabase secrets set APP_URL=https://your-site.netlify.app
--   3. Replace <project-ref> and <your-cron-secret> below before running.
-- ─────────────────────────────────────────────────────────────────

-- Enable required extensions (safe to run if already enabled)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule daily reminders at 8am UTC
-- Replace <project-ref> with your Supabase project reference (e.g. ugejeysmqqkyeefdqwao)
-- Replace <your-cron-secret> with the same value you passed to `supabase secrets set CRON_SECRET`
select cron.schedule(
  'send-due-reminders',
  '0 8 * * *',
  $cron$
  select net.http_post(
    url     := 'https://<project-ref>.supabase.co/functions/v1/send-due-reminders',
    headers := '{"Content-Type":"application/json","x-cron-secret":"<your-cron-secret>"}'::jsonb,
    body    := '{}'::jsonb
  ) as request_id;
  $cron$
);
