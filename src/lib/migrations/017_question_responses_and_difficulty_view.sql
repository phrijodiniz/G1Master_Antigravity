-- Migration 017: Question Responses & Difficulty View

-- 1. Create table public.question_responses to store detailed user attempts per question
CREATE TABLE IF NOT EXISTS public.question_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists
DROP POLICY IF EXISTS "Users can insert own responses" ON public.question_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON public.question_responses;

-- RLS policies
CREATE POLICY "Users can insert own responses" ON public.question_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses" ON public.question_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND (p.admin = 'YES' OR p.admin = 'yes' OR p.is_test_account = true)
        )
    );

-- Indexing for quick performance query sorting/aggregating
CREATE INDEX IF NOT EXISTS idx_question_responses_user_question_created ON public.question_responses(user_id, question_id, created_at ASC);

-- 2. Create the Database View for question difficulty metrics based on first attempts only
CREATE OR REPLACE VIEW public.view_question_difficulty AS
WITH first_attempts AS (
    -- Get the absolute first attempt per user per question
    SELECT DISTINCT ON (r.user_id, r.question_id)
        r.question_id,
        r.is_correct
    FROM public.question_responses r
    JOIN public.profiles p ON r.user_id = p.id
    WHERE p.is_test_account = false
      AND COALESCE(p.admin, '') NOT IN ('YES', 'yes')
      AND NOT (p.email ILIKE '%test%' OR p.email ILIKE '%demo%' OR p.email ILIKE '%@example.com')
    ORDER BY r.user_id, r.question_id, r.created_at ASC
)
SELECT
    q.id AS question_id,
    COUNT(f.question_id) AS first_attempts_count,
    SUM(CASE WHEN f.is_correct THEN 1 ELSE 0 END) AS correct_first_attempts,
    CASE 
        WHEN COUNT(f.question_id) = 0 THEN NULL
        ELSE ROUND((SUM(CASE WHEN f.is_correct THEN 1 ELSE 0 END)::float / COUNT(f.question_id)) * 100)
    END AS difficulty_percentage
FROM public.questions q
LEFT JOIN first_attempts f ON q.id = f.question_id
GROUP BY q.id;

-- 3. Create view_admin_questions joining difficulty statistics for operator dashboard
CREATE OR REPLACE VIEW public.view_admin_questions AS
SELECT
    q.id,
    q.created_at,
    q.text,
    q.media_url,
    q.options,
    q.correct_index,
    q.category,
    q.chapter,
    q.explanation,
    q.is_validated,
    COALESCE(d.first_attempts_count, 0) AS first_attempts_count,
    COALESCE(d.correct_first_attempts, 0) AS correct_first_attempts,
    d.difficulty_percentage
FROM public.questions q
LEFT JOIN public.view_question_difficulty d ON q.id = d.question_id;
