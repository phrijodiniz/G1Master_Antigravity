-- Create table for storing simulation results
create table if not exists public.simulation_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  score numeric not null, -- 0-100 percentage
  rules_score int not null,
  signs_score int not null,
  passed boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.simulation_results enable row level security;

-- Policy to allow users to save their results
create policy "Users can insert their own results" 
on public.simulation_results 
for insert 
to authenticated 
with check (auth.uid() = user_id);

-- Policy to allow users to view their own results
create policy "Users can view their own results" 
on public.simulation_results 
for select 
to authenticated 
using (auth.uid() = user_id);
