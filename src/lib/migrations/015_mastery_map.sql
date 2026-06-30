-- Create user_topic_progress table for Mastery Map progress tracking
CREATE TABLE IF NOT EXISTS public.user_topic_progress (
    id uuid default gen_random_uuid() primary key,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE not null,
    topic text not null, -- matches user-facing topic names from masteryConfig.ts
    questions_attempted integer default 0 not null,
    questions_correct integer default 0 not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    UNIQUE(user_id, topic)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_topic_progress ENABLE ROW LEVEL SECURITY;

-- Select policy: Users can only read their own topic progress records
CREATE POLICY "Users can view own topic progress"
ON public.user_topic_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Upsert policy: Users can only insert/update their own progress records
CREATE POLICY "Users can insert/update own topic progress"
ON public.user_topic_progress
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
