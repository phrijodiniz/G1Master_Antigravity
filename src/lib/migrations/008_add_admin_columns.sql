-- Add admin column to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'admin') THEN
        ALTER TABLE public.profiles ADD COLUMN admin text DEFAULT 'NO';
    END IF;
END $$;

-- Add is_validated to questions if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'is_validated') THEN
        ALTER TABLE public.questions ADD COLUMN is_validated boolean DEFAULT false;
    END IF;
END $$;

-- Enable RLS on questions if not already enabled (it should be, but safety first)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to recreate them safely
DROP POLICY IF EXISTS "Enable read access for all users" ON public.questions;
DROP POLICY IF EXISTS "Enable insert for admins" ON public.questions;
DROP POLICY IF EXISTS "Enable update for admins" ON public.questions;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.questions;

-- Policy: Anyone can read
CREATE POLICY "Enable read access for all users"
ON public.questions FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Only Admins can INSERT
CREATE POLICY "Enable insert for admins"
ON public.questions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.admin = 'YES'
  )
);

-- Policy: Only Admins can UPDATE
CREATE POLICY "Enable update for admins"
ON public.questions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.admin = 'YES'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.admin = 'YES'
  )
);

-- Policy: Only Admins can DELETE
CREATE POLICY "Enable delete for admins"
ON public.questions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.admin = 'YES'
  )
);

-- Note: We are using a text column 'admin' with value 'YES' as per requirement. 
-- A boolean would be cleaner but this follows the specific requirement "Value YES = admin".
