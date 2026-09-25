-- Migration 1: Extensions, Core Helper Functions, and Primary Tenant Tables
-- (users, organizations, organization_members, projects, project_members)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Automated updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- 1. USERS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  default_org_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clerk_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS default_org_id UUID;

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE OR REPLACE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 2. ORGANIZATIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);

CREATE OR REPLACE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Circular FK link for default_org_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_users_default_org' AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_default_org
      FOREIGN KEY (default_org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

--------------------------------------------------------------------------------
-- 3. ORGANIZATION MEMBERS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_org_user UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);

CREATE OR REPLACE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 4. PROJECTS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL, -- clerk_id or user UUID string
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  kind TEXT DEFAULT 'todo',
  ui_code TEXT,
  schema_code TEXT,
  api_code TEXT,
  readme_code TEXT,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'generating', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Guarantee missing columns are added if public.projects pre-existed
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'todo';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ui_code TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS schema_code TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS api_code TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS readme_code TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS files JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON public.projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_files_gin ON public.projects USING GIN (files);

CREATE OR REPLACE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 5. PROJECT MEMBERS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

CREATE OR REPLACE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- SECURITY HELPER FUNCTIONS
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_member(org_id_param UUID, user_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.users u ON u.id = om.user_id
    WHERE om.org_id = org_id_param
      AND (u.clerk_id = user_id_param OR u.id::text = user_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_project_member(project_id_param UUID, user_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id_param
      AND (p.user_id = user_id_param OR p.org_id IN (
        SELECT om.org_id FROM public.organization_members om
        JOIN public.users u ON u.id = om.user_id
        WHERE u.clerk_id = user_id_param OR u.id::text = user_id_param
      ))
  ) OR EXISTS (
    SELECT 1 FROM public.project_members pm
    JOIN public.users u ON u.id = pm.user_id
    WHERE pm.project_id = project_id_param
      AND (u.clerk_id = user_id_param OR u.id::text = user_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist before re-creating to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Users viewable by self" ON public.users;
DROP POLICY IF EXISTS "Users updatable by self" ON public.users;
DROP POLICY IF EXISTS "Orgs viewable by members" ON public.organizations;
DROP POLICY IF EXISTS "Orgs creatable by authenticated users" ON public.organizations;
DROP POLICY IF EXISTS "Projects viewable by owner or members" ON public.projects;
DROP POLICY IF EXISTS "Projects insertable by owner" ON public.projects;
DROP POLICY IF EXISTS "Projects updatable by owner or members" ON public.projects;
DROP POLICY IF EXISTS "Projects deletable by owner" ON public.projects;
DROP POLICY IF EXISTS "Project members viewable by project access" ON public.project_members;

-- Users policies
CREATE POLICY "Users viewable by self" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text OR auth.uid()::text = clerk_id);

CREATE POLICY "Users updatable by self" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text OR auth.uid()::text = clerk_id);

-- Organizations policies
CREATE POLICY "Orgs viewable by members" ON public.organizations
  FOR SELECT USING (public.is_org_member(id, auth.uid()::text) OR owner_id::text = auth.uid()::text);

CREATE POLICY "Orgs creatable by authenticated users" ON public.organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Projects policies
CREATE POLICY "Projects viewable by owner or members" ON public.projects
  FOR SELECT USING (
    user_id = auth.uid()::text 
    OR (org_id IS NOT NULL AND public.is_org_member(org_id, auth.uid()::text))
    OR public.is_project_member(id, auth.uid()::text)
  );

CREATE POLICY "Projects insertable by owner" ON public.projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR user_id = auth.uid()::text);

CREATE POLICY "Projects updatable by owner or members" ON public.projects
  FOR UPDATE USING (
    user_id = auth.uid()::text 
    OR public.is_project_member(id, auth.uid()::text)
  );

CREATE POLICY "Projects deletable by owner" ON public.projects
  FOR DELETE USING (user_id = auth.uid()::text);

-- Project Members policies
CREATE POLICY "Project members viewable by project access" ON public.project_members
  FOR SELECT USING (public.is_project_member(project_id, auth.uid()::text));
