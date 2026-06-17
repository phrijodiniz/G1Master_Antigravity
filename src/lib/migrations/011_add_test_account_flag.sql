-- Add is_test_account column to profiles to allow flagging test accounts
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN DEFAULT FALSE;
