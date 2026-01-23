-- Add credit columns with defaults
-- (Empty as both columns are removed from initial design)
-- ALTER TABLE public.profiles ... (Removed)

-- Update handle_new_user to include credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_premium)
  VALUES (new.id, new.email, FALSE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing Standard users (who might have null credits if columns added without default, but default handles new rows. 
-- For existing rows, the ADD COLUMN ... DEFAULT 5 fill them automatically in Postgres 11+)
-- However, just to be safe or if we want to reset them:
-- UPDATE public.profiles ... (Removed)
