-- Migration 3: Database Designs, Tables, Columns, API Specifications, and Development Tasks
-- (database_designs, database_tables, database_columns, api_specifications, development_tasks)

--------------------------------------------------------------------------------
-- 11. DATABASE DESIGNS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.database_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES public.blueprints(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  engine_type TEXT NOT NULL DEFAULT 'postgresql',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_db_designs_project_id ON public.database_designs(project_id);

CREATE TRIGGER update_db_designs_updated_at
  BEFORE UPDATE ON public.database_designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 12. DATABASE TABLES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.database_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_design_id UUID NOT NULL REFERENCES public.database_designs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_db_tables_design_id ON public.database_tables(database_design_id);

CREATE TRIGGER update_db_tables_updated_at
  BEFORE UPDATE ON public.database_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 13. DATABASE COLUMNS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.database_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.database_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data_type TEXT NOT NULL,
  is_primary_key BOOLEAN NOT NULL DEFAULT FALSE,
  is_nullable BOOLEAN NOT NULL DEFAULT TRUE,
  is_unique BOOLEAN NOT NULL DEFAULT FALSE,
  default_value TEXT,
  foreign_table_id UUID REFERENCES public.database_tables(id) ON DELETE SET NULL,
  foreign_column_id UUID REFERENCES public.database_columns(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_db_columns_table_id ON public.database_columns(table_id);

CREATE TRIGGER update_db_columns_updated_at
  BEFORE UPDATE ON public.database_columns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 14. API SPECIFICATIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  spec_type TEXT NOT NULL DEFAULT 'openapi_v3',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_specs_project_id ON public.api_specifications(project_id);

CREATE TRIGGER update_api_specs_updated_at
  BEFORE UPDATE ON public.api_specifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 15. DEVELOPMENT TASKS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.development_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_tasks_project_id ON public.development_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_dev_tasks_assigned_to ON public.development_tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_dev_tasks_status ON public.development_tasks(status);

CREATE TRIGGER update_dev_tasks_updated_at
  BEFORE UPDATE ON public.development_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.database_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_tasks ENABLE ROW LEVEL SECURITY;

-- Database Designs Policies
CREATE POLICY "DB designs access by project" ON public.database_designs
  FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));

-- Database Tables Policies
CREATE POLICY "DB tables access by project" ON public.database_tables
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.database_designs d WHERE d.id = database_design_id AND public.is_project_member(d.project_id, auth.uid()::text)
  ));

-- Database Columns Policies
CREATE POLICY "DB columns access by project" ON public.database_columns
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.database_tables t
    JOIN public.database_designs d ON d.id = t.database_design_id
    WHERE t.id = table_id AND public.is_project_member(d.project_id, auth.uid()::text)
  ));

-- API Specifications Policies
CREATE POLICY "API specs access by project" ON public.api_specifications
  FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));

-- Development Tasks Policies
CREATE POLICY "Dev tasks access by project" ON public.development_tasks
  FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));
