-- Migration 012: Presets and Events Tables

-- 1. Create analytics_presets table
CREATE TABLE IF NOT EXISTS public.analytics_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);

-- Enable RLS
ALTER TABLE public.analytics_presets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can select analytics_presets" ON public.analytics_presets;
DROP POLICY IF EXISTS "Admins can insert analytics_presets" ON public.analytics_presets;
DROP POLICY IF EXISTS "Admins can update analytics_presets" ON public.analytics_presets;
DROP POLICY IF EXISTS "Admins can delete analytics_presets" ON public.analytics_presets;

-- Policies using existing public.is_admin() helper
CREATE POLICY "Admins can select analytics_presets" ON public.analytics_presets
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert analytics_presets" ON public.analytics_presets
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update analytics_presets" ON public.analytics_presets
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete analytics_presets" ON public.analytics_presets
  FOR DELETE USING (public.is_admin());


-- 2. Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  category TEXT NOT NULL CHECK (category IN ('Feature Release', 'Marketing Campaign', 'Pricing Change', 'Product Update', 'Other')),
  is_archived BOOLEAN DEFAULT false NOT NULL
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can select analytics_events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can insert analytics_events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can update analytics_events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can delete analytics_events" ON public.analytics_events;

-- Policies using existing public.is_admin() helper
CREATE POLICY "Admins can select analytics_events" ON public.analytics_events
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert analytics_events" ON public.analytics_events
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update analytics_events" ON public.analytics_events
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete analytics_events" ON public.analytics_events
  FOR DELETE USING (public.is_admin());
