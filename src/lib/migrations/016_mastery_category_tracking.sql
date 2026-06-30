-- Add per-category (Rules vs Signs) tracking columns to user_topic_progress
-- This enables the readiness calculation to incorporate Mastery Map data
-- into the per-category accuracy bars on the dashboard.

ALTER TABLE public.user_topic_progress
ADD COLUMN IF NOT EXISTS rules_attempted integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS rules_correct integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS signs_attempted integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS signs_correct integer DEFAULT 0 NOT NULL;
