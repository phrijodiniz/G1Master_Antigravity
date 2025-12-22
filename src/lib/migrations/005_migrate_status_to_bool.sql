-- Add is_premium column (Default false)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Backfill data: If status was 'Premium', set is_premium to TRUE
UPDATE public.profiles
SET is_premium = TRUE
WHERE status = 'Premium';

-- Drop the old status column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS status;

-- Update the handle_new_user function to set is_premium
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_premium)
  VALUES (new.id, new.email, FALSE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
