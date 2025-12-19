-- Add test_type column to simulation_results
alter table public.simulation_results 
add column if not exists test_type text default 'Simulation';

-- Update existing records to be 'Simulation' (optional, as default covers it, but good for clarity)
update public.simulation_results 
set test_type = 'Simulation' 
where test_type is null;
