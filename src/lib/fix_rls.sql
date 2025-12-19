-- The previous policy was restricted "TO anon", which blocked logged-in users.
-- This script fixes it by allowing access "TO public" (everyone).

DROP POLICY IF EXISTS "Enable read access for all users" ON public.questions;

CREATE POLICY "Enable read access for all users"
ON public.questions
FOR SELECT
TO public
USING (true);
