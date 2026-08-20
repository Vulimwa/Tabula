-- TABULA Database Schema & RLS Policies (PostgreSQL for Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'University',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Viewer',
  organization_id UUID REFERENCES public.organizations(id),
  status TEXT NOT NULL DEFAULT 'Active',
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL DEFAULT 'British Parliamentary',
  status TEXT NOT NULL DEFAULT 'Upcoming',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  venue TEXT NOT NULL,
  rounds_count INT DEFAULT 4,
  current_round INT DEFAULT 1,
  max_speakers_per_team INT DEFAULT 2,
  scoring_system TEXT DEFAULT 'Standard 100-Point',
  is_results_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  institution TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Open',
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  total_points NUMERIC DEFAULT 0,
  speaker_points NUMERIC DEFAULT 0,
  rank INT DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Speakers Table
CREATE TABLE IF NOT EXISTS public.speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  institution TEXT NOT NULL,
  category TEXT DEFAULT 'Open',
  total_points NUMERIC DEFAULT 0,
  average_score NUMERIC DEFAULT 0,
  highest_score NUMERIC DEFAULT 0,
  rounds_debated INT DEFAULT 0,
  rank INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Judges Table
CREATE TABLE IF NOT EXISTS public.judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  institution TEXT NOT NULL,
  experience_level TEXT DEFAULT 'Panelist',
  rating NUMERIC DEFAULT 7.5,
  assigned_rounds INT DEFAULT 0,
  ballots_submitted INT DEFAULT 0,
  status TEXT DEFAULT 'Available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Rounds Table
CREATE TABLE IF NOT EXISTS public.rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  name TEXT NOT NULL,
  motion TEXT NOT NULL,
  info_slide TEXT,
  start_time TIMESTAMPTZ,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Rooms / Debates Table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  government_team_id UUID REFERENCES public.teams(id),
  opposition_team_id UUID REFERENCES public.teams(id),
  status TEXT DEFAULT 'Not Started',
  winner_team_id UUID REFERENCES public.teams(id),
  expected_ballots INT DEFAULT 1,
  submitted_ballots INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Ballots Table
CREATE TABLE IF NOT EXISTS public.ballots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debate_room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  judge_id UUID NOT NULL REFERENCES public.judges(id),
  judge_name TEXT NOT NULL,
  winning_team_id UUID REFERENCES public.teams(id),
  government_total_points NUMERIC DEFAULT 0,
  opposition_total_points NUMERIC DEFAULT 0,
  speaker_scores JSONB DEFAULT '[]'::jsonb,
  strengths_comment TEXT,
  improvements_comment TEXT,
  general_comments TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Surveys Table
CREATE TABLE IF NOT EXISTS public.surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Draft',
  questions JSONB DEFAULT '[]'::jsonb,
  responses_count INT DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0,
  average_time_minutes NUMERIC DEFAULT 0,
  public_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Survey Responses Table
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  time_spent_seconds INT DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details TEXT,
  result TEXT DEFAULT 'Success'
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read organization data they belong to
CREATE POLICY "Org members read organizations" ON public.organizations
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE organization_id = public.organizations.id));

-- Read the caller's organization without recursively invoking a policy on
-- profiles. SECURITY DEFINER is required because this helper reads profiles
-- while evaluating a policy on the same table.
CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid()
$$;

-- Allow users to read their own profile and profiles in their organization.
-- The previous policy selected directly from public.profiles here, which
-- caused PostgreSQL to evaluate the policy recursively.
DROP POLICY IF EXISTS "Read profiles in same org" ON public.profiles;
CREATE POLICY "Read profiles in same org" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR organization_id = public.current_user_organization_id()
  );

-- Allow public read access to published events results
CREATE POLICY "Public read published event results" ON public.events
  FOR SELECT USING (is_results_published = TRUE OR organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Allow public read access for published surveys
CREATE POLICY "Public read published surveys" ON public.surveys
  FOR SELECT USING (status = 'Published');

-- Allow public survey response insertion
CREATE POLICY "Public submit survey response" ON public.survey_responses
  FOR INSERT WITH CHECK (survey_id IN (SELECT id FROM public.surveys WHERE status = 'Published'));

-- Explicit API privileges. RLS still controls which rows anon/authenticated
-- users can access; service_role is used by the server-side API.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON public.organizations, public.profiles TO authenticated;
GRANT INSERT ON public.survey_responses TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO authenticated;
