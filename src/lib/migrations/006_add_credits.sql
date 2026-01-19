-- Add credit columns with defaults
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS practice_credits INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS simulation_credits INTEGER DEFAULT 1;

-- Update handle_new_user to include credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_premium, practice_credits, simulation_credits)
  VALUES (new.id, new.email, FALSE, 5, 1);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing Standard users (who might have null credits if columns added without default, but default handles new rows. 
-- For existing rows, the ADD COLUMN ... DEFAULT 5 fill them automatically in Postgres 11+)
-- However, just to be safe or if we want to reset them:
UPDATE public.profiles
SET practice_credits = 5, simulation_credits = 1
WHERE practice_credits IS NULL OR simulation_credits IS NULL;
