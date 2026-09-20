-- Migration 2: Blueprints, Blueprint Versions, Requirements, and Architecture
-- (blueprints, blueprint_versions, requirements, architecture_components, architecture_connections)

--------------------------------------------------------------------------------
-- 6. BLUEPRINTS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  current_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprints_project_id ON public.blueprints(project_id);

CREATE TRIGGER update_blueprints_updated_at
  BEFORE UPDATE ON public.blueprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 7. BLUEPRINT VERSIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blueprint_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  prompt TEXT NOT NULL,
  ui_code TEXT,
  schema_code TEXT,
  api_code TEXT,
  readme_code TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_blueprint_version UNIQUE (blueprint_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_blueprint_versions_blueprint_id ON public.blueprint_versions(blueprint_id);

-- Foreign Key link for current_version_id
ALTER TABLE public.blueprints
  ADD CONSTRAINT fk_blueprints_current_version
  FOREIGN KEY (current_version_id) REFERENCES public.blueprint_versions(id) ON DELETE SET NULL;

--------------------------------------------------------------------------------
-- 8. REQUIREMENTS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES public.blueprints(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'implemented', 'rejected')),
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requirements_project_id ON public.requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_requirements_blueprint_id ON public.requirements(blueprint_id);

CREATE TRIGGER update_requirements_updated_at
  BEFORE UPDATE ON public.requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 9. ARCHITECTURE COMPONENTS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.architecture_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES public.blueprints(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'backend' CHECK (type IN ('frontend', 'backend', 'database', 'cache', 'queue', 'auth', 'external_api', 'storage')),
  description TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arch_components_project_id ON public.architecture_components(project_id);

CREATE TRIGGER update_arch_components_updated_at
  BEFORE UPDATE ON public.architecture_components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 10. ARCHITECTURE CONNECTIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.architecture_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_component_id UUID NOT NULL REFERENCES public.architecture_components(id) ON DELETE CASCADE,
  target_component_id UUID NOT NULL REFERENCES public.architecture_components(id) ON DELETE CASCADE,
  connection_type TEXT DEFAULT 'async',
  label TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arch_conn_project_id ON public.architecture_connections(project_id);
CREATE INDEX IF NOT EXISTS idx_arch_conn_source ON public.architecture_connections(source_component_id);
CREATE INDEX IF NOT EXISTS idx_arch_conn_target ON public.architecture_connections(target_component_id);

CREATE TRIGGER update_arch_conn_updated_at
  BEFORE UPDATE ON public.architecture_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprint_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_connections ENABLE ROW LEVEL SECURITY;

-- Blueprints Policies
CREATE POLICY "Blueprints viewable by project access" ON public.blueprints
  FOR SELECT USING (public.is_project_member(project_id, auth.uid()::text));

CREATE POLICY "Blueprints manageable by project access" ON public.blueprints
  FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));

-- Blueprint Versions Policies
CREATE POLICY "Versions viewable by project access" ON public.blueprint_versions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.blueprints b WHERE b.id = blueprint_id AND public.is_project_member(b.project_id, auth.uid()::text)
  ));

CREATE POLICY "Versions insertable by project access" ON public.blueprint_versions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.blueprints b WHERE b.id = blueprint_id AND public.is_project_member(b.project_id, auth.uid()::text)
  ));

-- Requirements Policies
CREATE POLICY "Requirements access by project" ON public.requirements
  FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));

-- Architecture Components Policies
CREATE POLICY "Arch components access by project" ON public.architecture_components
  FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));

-- Architecture Connections Policies
CREATE POLICY "Arch connections access by project" ON public.architecture_connections
  FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));
