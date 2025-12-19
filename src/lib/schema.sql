-- Create the questions table
create table public.questions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  text text not null,
  media_url text, -- for images (can be null)
  options jsonb not null, -- array of strings e.g. ["Stop", "Go", "Yield"]
  correct_index integer not null, -- 0-based index
  category text not null, -- 'Rules of the Road' or 'Road Signs'
  chapter text, -- e.g. 'Traffic Lights'
  explanation text -- detailed explanation for the answer
);

-- Enable Row Level Security (RLS)
alter table public.questions enable row level security;

-- Create a policy that allows anyone to read questions (public access)
create policy "Enable read access for all users"
on public.questions
for select
to anon
using (true);

-- Create a policy that allows authenticated users (or service role) to insert/update/delete
-- For development/seeding simplicity, you might want to allow anon inserts TEMPORARILY if running a client-side seed script,
-- but standard practice involves using the Service Role key for admin tasks.

-- Function to get random questions
create or replace function get_random_questions(limit_count int, category_filter text)
returns setof public.questions
language sql
as $$
  select *
  from public.questions
  where category = category_filter
  order by random()
  limit limit_count;
$$;

