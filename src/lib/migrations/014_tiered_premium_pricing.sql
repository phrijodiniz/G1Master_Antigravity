-- Migration 014: Add Tiered Premium Pricing expiration tracking

-- 1. Add premium_until column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ DEFAULT NULL;

-- 2. Flag all current premium users with lifetime access (premium_until = NULL)
UPDATE public.profiles
SET premium_until = NULL
WHERE is_premium = TRUE;
