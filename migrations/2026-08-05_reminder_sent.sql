-- Tracks the one-time "eksik bilgi" (missing-info) reminder so each registrant is
-- e-mailed at most once. NULL = not yet processed by the reminder cron.
ALTER TABLE public.registrants
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Speeds up the daily cron's "not yet reminded" scan.
CREATE INDEX IF NOT EXISTS registrants_reminder_sent_at_idx
  ON public.registrants (reminder_sent_at);
