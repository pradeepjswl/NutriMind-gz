-- NutriMind AI - Complete Database Schema
-- Run this migration to set up all tables

-- 1. PROFILES TABLE - User profile + settings
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  age integer,
  weight numeric(5,2), -- in kg
  height numeric(5,2), -- in cm
  gender text check (gender in ('male', 'female', 'other')),
  goal text check (goal in ('weight_loss', 'maintenance', 'muscle_gain')),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  diet_type text check (diet_type in ('vegetarian', 'vegan', 'non_veg', 'keto', 'balanced', 'high_protein')),
  allergies text[] default '{}',
  calorie_goal integer,
  protein_goal integer,
  carb_goal integer,
  fat_goal integer,
  fiber_goal integer default 25,
  water_goal integer default 8, -- glasses per day
  onboarded boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. MEAL_LOGS TABLE - Daily meal tracking
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text default '🍽️',
  category text check (category in ('breakfast', 'lunch', 'dinner', 'snack', 'scanned', 'manual')),
  calories integer not null default 0,
  protein numeric(6,2) default 0,
  carbs numeric(6,2) default 0,
  fat numeric(6,2) default 0,
  fiber numeric(6,2) default 0,
  health_score text check (health_score in ('A', 'B', 'C', 'D', 'F')),
  image_url text,
  logged_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- 3. WATER_LOGS TABLE - Water intake tracking
create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  glasses integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, date)
);

-- 4. USER_STATS TABLE - Streaks and achievements
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  log_streak integer default 0,
  water_streak integer default 0,
  protein_streak integer default 0,
  longest_log_streak integer default 0,
  longest_water_streak integer default 0,
  total_meals integer default 0,
  scans_used integer default 0,
  plans_generated integer default 0,
  chat_messages integer default 0,
  earned_badges text[] default '{}',
  last_log_date date,
  last_water_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. MEAL_PLANS TABLE - Weekly meal plans
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  plan_data jsonb not null default '{}',
  created_at timestamp with time zone default now()
);

-- 6. RECIPES TABLE - Internal recipe database
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text default '🍽️',
  category text check (category in ('breakfast', 'lunch', 'dinner', 'snack')),
  tags text[] default '{}',
  calories integer not null,
  protein numeric(6,2) default 0,
  carbs numeric(6,2) default 0,
  fat numeric(6,2) default 0,
  fiber numeric(6,2) default 0,
  prep_time integer default 15, -- minutes
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  ingredients text[] default '{}',
  steps text[] default '{}',
  diet_types text[] default '{}', -- compatible diet types
  created_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_meal_logs_user_id on public.meal_logs(user_id);
create index if not exists idx_meal_logs_logged_at on public.meal_logs(logged_at);
create index if not exists idx_water_logs_user_date on public.water_logs(user_id, date);
create index if not exists idx_meal_plans_user_id on public.meal_plans(user_id);
create index if not exists idx_recipes_category on public.recipes(category);
create index if not exists idx_recipes_diet_types on public.recipes using gin(diet_types);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.meal_logs enable row level security;
alter table public.water_logs enable row level security;
alter table public.user_stats enable row level security;
alter table public.meal_plans enable row level security;
alter table public.recipes enable row level security;

-- RLS Policies for PROFILES
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- RLS Policies for MEAL_LOGS
create policy "meal_logs_select_own" on public.meal_logs for select using (auth.uid() = user_id);
create policy "meal_logs_insert_own" on public.meal_logs for insert with check (auth.uid() = user_id);
create policy "meal_logs_update_own" on public.meal_logs for update using (auth.uid() = user_id);
create policy "meal_logs_delete_own" on public.meal_logs for delete using (auth.uid() = user_id);

-- RLS Policies for WATER_LOGS
create policy "water_logs_select_own" on public.water_logs for select using (auth.uid() = user_id);
create policy "water_logs_insert_own" on public.water_logs for insert with check (auth.uid() = user_id);
create policy "water_logs_update_own" on public.water_logs for update using (auth.uid() = user_id);
create policy "water_logs_delete_own" on public.water_logs for delete using (auth.uid() = user_id);

-- RLS Policies for USER_STATS
create policy "user_stats_select_own" on public.user_stats for select using (auth.uid() = user_id);
create policy "user_stats_insert_own" on public.user_stats for insert with check (auth.uid() = user_id);
create policy "user_stats_update_own" on public.user_stats for update using (auth.uid() = user_id);
create policy "user_stats_delete_own" on public.user_stats for delete using (auth.uid() = user_id);

-- RLS Policies for MEAL_PLANS
create policy "meal_plans_select_own" on public.meal_plans for select using (auth.uid() = user_id);
create policy "meal_plans_insert_own" on public.meal_plans for insert with check (auth.uid() = user_id);
create policy "meal_plans_update_own" on public.meal_plans for update using (auth.uid() = user_id);
create policy "meal_plans_delete_own" on public.meal_plans for delete using (auth.uid() = user_id);

-- RLS Policies for RECIPES - public read, no write from clients
create policy "recipes_select_all" on public.recipes for select to authenticated using (true);

-- Trigger function to auto-create profile and stats on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', null)
  )
  on conflict (id) do nothing;

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Drop existing trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

drop trigger if exists water_logs_updated_at on public.water_logs;
create trigger water_logs_updated_at before update on public.water_logs
  for each row execute function public.update_updated_at_column();

drop trigger if exists user_stats_updated_at on public.user_stats;
create trigger user_stats_updated_at before update on public.user_stats
  for each row execute function public.update_updated_at_column();
