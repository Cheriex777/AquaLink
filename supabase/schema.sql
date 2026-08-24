-- ============================================================
-- JalSetu – Supabase schema (Phase 10)
-- Run this whole file in the Supabase SQL editor.
-- Safe to re-run: idempotent (uses IF NOT EXISTS / OR REPLACE).
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- updated_at helper
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- profiles (one row per auth user, auto-created)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(coalesce(new.email, 'user'), '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- assessments (core row the user owns)
-- ------------------------------------------------------------
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null default 'completed' check (status in ('draft', 'completed')),

  -- property & location
  property_name text not null,
  city text,
  state text,
  pincode text,
  latitude double precision,
  longitude double precision,

  -- rooftop
  roof_area_sqm numeric not null check (roof_area_sqm > 0),
  roof_material text not null,
  roof_type text,
  open_space_sqm numeric,
  roof_polygon jsonb,
  roof_area_source text not null default 'manual'
    check (roof_area_source in ('manual', 'satellite-measured')),

  -- water demand & rainfall actually used by the engine
  household_size numeric,
  per_capita_lpd numeric,
  annual_rainfall_mm numeric,
  rainfall_source text check (rainfall_source in ('open-meteo', 'manual')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessments_user_id_idx on public.assessments (user_id, created_at desc);

alter table public.assessments enable row level security;

drop policy if exists "assessments_select_own" on public.assessments;
create policy "assessments_select_own"
  on public.assessments for select
  using (auth.uid() = user_id);

drop policy if exists "assessments_insert_own" on public.assessments;
create policy "assessments_insert_own"
  on public.assessments for insert
  with check (auth.uid() = user_id);

drop policy if exists "assessments_update_own" on public.assessments;
create policy "assessments_update_own"
  on public.assessments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "assessments_delete_own" on public.assessments;
create policy "assessments_delete_own"
  on public.assessments for delete
  using (auth.uid() = user_id);

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at
  before update on public.assessments
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- environmental_data (snapshot per source per assessment)
-- ------------------------------------------------------------
create table if not exists public.environmental_data (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  source text not null check (source in ('rainfall', 'soil', 'air_quality')),
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  unique (assessment_id, source)
);

create index if not exists environmental_data_assessment_id_idx
  on public.environmental_data (assessment_id);

alter table public.environmental_data enable row level security;

drop policy if exists "environmental_data_all_own" on public.environmental_data;
create policy "environmental_data_all_own"
  on public.environmental_data for all
  using (
    exists (
      select 1 from public.assessments a
      where a.id = environmental_data.assessment_id
        and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.assessments a
      where a.id = environmental_data.assessment_id
        and a.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- assessment_results (engine output snapshot, one per assessment)
-- ------------------------------------------------------------
create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.assessments (id) on delete cascade,
  result jsonb not null,
  engine_version text not null default '1',
  created_at timestamptz not null default now()
);

create index if not exists assessment_results_assessment_id_idx
  on public.assessment_results (assessment_id);

alter table public.assessment_results enable row level security;

drop policy if exists "assessment_results_all_own" on public.assessment_results;
create policy "assessment_results_all_own"
  on public.assessment_results for all
  using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_results.assessment_id
        and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_results.assessment_id
        and a.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- recommendations (Phase 8 output snapshot, one per assessment)
-- ------------------------------------------------------------
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.assessments (id) on delete cascade,
  primary_structure text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists recommendations_assessment_id_idx
  on public.recommendations (assessment_id);

alter table public.recommendations enable row level security;

drop policy if exists "recommendations_all_own" on public.recommendations;
create policy "recommendations_all_own"
  on public.recommendations for all
  using (
    exists (
      select 1 from public.assessments a
      where a.id = recommendations.assessment_id
        and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.assessments a
      where a.id = recommendations.assessment_id
        and a.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- reports (rendered report records; full rendering lands in Phase 11)
-- ------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.assessments (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text,
  generated_at timestamptz not null default now()
);

create index if not exists reports_user_id_idx on public.reports (user_id, generated_at desc);

alter table public.reports enable row level security;

drop policy if exists "reports_all_own" on public.reports;
create policy "reports_all_own"
  on public.reports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
