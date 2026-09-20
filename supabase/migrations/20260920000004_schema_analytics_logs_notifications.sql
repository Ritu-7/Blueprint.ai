-- Migration 5: Project Health Snapshots, Notifications, and Activity Logs
-- (project_health_snapshots, notifications, activity_logs)

--------------------------------------------------------------------------------
-- 24. PROJECT HEALTH SNAPSHOTS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  health_score INT NOT NULL CHECK (health_score BETWEEN 0 AND 100),
  security_score INT NOT NULL CHECK (security_score BETWEEN 0 AND 100),
  test_coverage_percent NUMERIC(5, 2) DEFAULT 0.00,
  build_status TEXT NOT NULL DEFAULT 'passing' CHECK (build_status IN ('passing', 'failing', 'pending')),
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_project_id ON public.project_health_snapshots(project_id);

--------------------------------------------------------------------------------
-- 25. NOTIFICATIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

--------------------------------------------------------------------------------
-- 26. ACTIVITY LOGS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- clerk_id or user UUID string
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON public.activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_metadata_gin ON public.activity_logs USING GIN (metadata);

--------------------------------------------------------------------------------
-- RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.project_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Project Health Snapshots Policies
CREATE POLICY "Health snapshots access by project" ON public.project_health_snapshots
  FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));

-- Notifications Policies
CREATE POLICY "Notifications access by user" ON public.notifications
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Activity Logs Policies
CREATE POLICY "Activity logs viewable by project access" ON public.activity_logs
  FOR SELECT USING (
    user_id = auth.uid()::text 
    OR (project_id IS NOT NULL AND public.is_project_member(project_id, auth.uid()::text))
  );

CREATE POLICY "Activity logs insertable by authenticated users" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR user_id = auth.uid()::text);
