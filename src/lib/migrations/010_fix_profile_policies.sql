-- Fix Profile Policies causing timeouts due to recursion

-- 1. Create a secure function to check admin status
-- SECURITY DEFINER allows this function to bypass RLS, avoiding the infinite loop
-- when the 'profiles' policy tries to query 'profiles' to check for admin status.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND admin = 'YES'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Reset Policies on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop known potential policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles; -- Potential ghost policy
DROP POLICY IF EXISTS "Public profiles access" ON public.profiles; -- Potential ghost policy

-- 3. Re-create Safe Policies

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles (using the safe function)
CREATE POLICY "Admins can read all profiles" ON public.profiles
FOR SELECT USING (public.is_admin());

-- Admins can update all profiles (using the safe function)
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (public.is_admin());
