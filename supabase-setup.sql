-- =====================================================================
--  Sem 3 PYQ Portal — Supabase setup
--
--  Run this ONCE in your Supabase project's SQL Editor
--  (Dashboard → SQL Editor → New query → paste → Run).
--
--  This is only needed if you want accounts and progress to sync
--  across devices. Without it the portal still works, storing
--  everything in each browser's localStorage.
--
--  Safe to re-run: it drops and recreates its own policies.
-- =====================================================================

-- ---------------------------------------------------------------
-- 1. profiles — lets the login screen tell a first visit from a
--    returning one, before the user has typed a password.
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  roll        text primary key,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "roll numbers are readable"            on public.profiles;
drop policy if exists "authenticated users may register a roll" on public.profiles;
drop policy if exists "a signed-in student registers their roll" on public.profiles;

-- Anyone may check whether a roll number is registered. This reveals
-- nothing beyond "an account exists" and has to work before login,
-- because the login screen asks the question while still anonymous.
create policy "roll numbers are readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

-- Only a signed-in student may register a roll, and only their own —
-- the roll is checked against the email in their JWT, so it cannot be
-- spoofed and nobody can squat on someone else's number.
create policy "a signed-in student registers their roll"
  on public.profiles for insert
  to authenticated
  with check (lower(roll) = split_part(lower(auth.jwt() ->> 'email'), '@', 1));


-- ---------------------------------------------------------------
-- 2. progress — solved flags and personal remarks, one row per roll.
-- ---------------------------------------------------------------
create table if not exists public.progress (
  roll        text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz default now()
);

alter table public.progress enable row level security;

drop policy if exists "students read their own progress"   on public.progress;
drop policy if exists "students write their own progress"  on public.progress;
drop policy if exists "students update their own progress" on public.progress;

-- Each student may read and write only their own row. The roll number is
-- derived from the email the portal signs in with, 0201ai2510xx@pyqportal.local.
--
-- NOTE the lower() on both sides. The app stores the roll uppercase
-- (0201AI251007) but signs in with a lowercased email. Comparing them
-- raw never matches, RLS silently rejects every write, and progress
-- looks like it saves but never syncs. Do not remove the lower().
create policy "students read their own progress"
  on public.progress for select
  to authenticated
  using (lower(roll) = split_part(lower(auth.jwt() ->> 'email'), '@', 1));

create policy "students write their own progress"
  on public.progress for insert
  to authenticated
  with check (lower(roll) = split_part(lower(auth.jwt() ->> 'email'), '@', 1));

create policy "students update their own progress"
  on public.progress for update
  to authenticated
  using  (lower(roll) = split_part(lower(auth.jwt() ->> 'email'), '@', 1))
  with check (lower(roll) = split_part(lower(auth.jwt() ->> 'email'), '@', 1));


-- ---------------------------------------------------------------
-- 3. Then, in the dashboard:
--
--    Authentication → Sign In / Providers → Email
--      • Enable email provider ....... ON
--      • Confirm email ............... OFF   (roll-number addresses
--                                             are not real mailboxes,
--                                             so nobody could confirm)
--
--    Project Settings → API → copy "Project URL" and the
--    "anon public" key into config.js.
-- ---------------------------------------------------------------


-- ---------------------------------------------------------------
-- 4. Handy checks
-- ---------------------------------------------------------------
-- Who has signed up:
--   select roll, created_at from public.profiles order by roll;
--
-- How many questions each student has marked solved:
--   select roll,
--          coalesce(jsonb_array_length(
--            jsonb_path_query_array(data, '$.solved.keyvalue().key')), 0) as solved
--   from public.progress
--   order by solved desc;
--
-- How much space it is all taking:
--   select pg_size_pretty(pg_total_relation_size('public.progress'));
