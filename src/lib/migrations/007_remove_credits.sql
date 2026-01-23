-- Remove credit columns
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS practice_credits,
DROP COLUMN IF EXISTS simulation_credits;

-- Update handle_new_user to remove credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_premium)
  VALUES (new.id, new.email, FALSE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
