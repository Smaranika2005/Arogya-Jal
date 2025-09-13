-- 1. Create a `profiles` table to store user metadata (role, name, etc.).
-- This is essential for role-based access control.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamp with time zone default now(),
  name text not null,
  role text not null check (role in ('asha_worker', 'government'))
);

-- Enable Row Level Security (RLS) on the profiles table
alter table public.profiles enable row level security;

-- Policy: A user can only view and update their own profile.
create policy "Users can view and update their own profile." on public.profiles
  for all using (auth.uid() = id);

-- 2. Create a security definer function to get user role (prevents RLS recursion)
create or replace function public.get_user_role(user_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = user_id;
$$;

-- 3. Create a `surveys` table to store the data submitted by ASHA workers.
-- This table will be the single source of truth for your analytics.
create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  -- The asha_worker_id column links this survey to a specific profile
  asha_worker_id uuid references public.profiles (id) on delete cascade,
  
  -- Use `jsonb` for a flexible and searchable structure for survey data
  -- which can change over time without altering the table schema.
  survey_data jsonb not null,
  
  -- Add specific columns for data you'll query frequently for analytics
  -- This improves query performance and is a good practice.
  symptoms text[], -- Storing symptoms as an array of strings
  water_quality text check (water_quality in ('Safe', 'Unsafe', 'Contaminated', 'Unknown')),
  
  -- Add location data for geo-based analytics
  latitude numeric,
  longitude numeric,

  notes text
);

-- Enable Row Level Security (RLS) on the surveys table
alter table public.surveys enable row level security;

-- Policy for ASHA workers:
-- They can only insert new surveys and view their own submissions.
create policy "ASHA workers can create and view their own surveys." on public.surveys
  for all using (auth.uid() = asha_worker_id);

-- Policy for Government users:
-- They can view all surveys. Using security definer function to prevent RLS recursion.
create policy "Government users can view all surveys." on public.surveys
  for select using (public.get_user_role() = 'government');

-- 4. Create function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'name', 'User'), 
    coalesce(new.raw_user_meta_data->>'role', 'asha_worker')
  );
  return new;
end;
$$;

-- 5. Create trigger to automatically create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Recommended: Create indexes to speed up your analytics queries.
-- This is especially useful for the Government Dashboard.
create index on public.surveys (asha_worker_id);
create index on public.surveys using GIN (symptoms);
create index on public.surveys (water_quality);
create index on public.surveys (created_at);
create index on public.profiles (role);