-- Migration 4: Repositories, Files, Code Chunks, AI Conversations, Messages, Code Reviews, Findings, Test Cases
-- (repositories, repository_files, code_chunks, ai_conversations, ai_messages, code_reviews, review_findings, test_cases)

--------------------------------------------------------------------------------
-- 16. REPOSITORIES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'github',
  repo_url TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repositories_project_id ON public.repositories(project_id);

CREATE TRIGGER update_repositories_updated_at
  BEFORE UPDATE ON public.repositories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 17. REPOSITORY FILES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.repository_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  language TEXT,
  content TEXT,
  sha TEXT,
  commit_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_repo_file_path UNIQUE (repository_id, path)
);

CREATE INDEX IF NOT EXISTS idx_repo_files_repo_id ON public.repository_files(repository_id);

CREATE TRIGGER update_repo_files_updated_at
  BEFORE UPDATE ON public.repository_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 18. CODE CHUNKS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.code_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_file_id UUID NOT NULL REFERENCES public.repository_files(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  token_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_chunks_file_id ON public.code_chunks(repository_file_id);

--------------------------------------------------------------------------------
-- 19. AI CONVERSATIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- clerk_id or user UUID string
  title TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'builder',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_project_id ON public.ai_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 20. AI MESSAGES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  token_usage JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_id ON public.ai_messages(conversation_id);

--------------------------------------------------------------------------------
-- 21. CODE REVIEWS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.code_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  repository_id UUID REFERENCES public.repositories(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  summary TEXT,
  score NUMERIC(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_reviews_project_id ON public.code_reviews(project_id);

CREATE TRIGGER update_code_reviews_updated_at
  BEFORE UPDATE ON public.code_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 22. REVIEW FINDINGS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_review_id UUID NOT NULL REFERENCES public.code_reviews(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  line_number INT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  description TEXT NOT NULL,
  suggestion TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_findings_review_id ON public.review_findings(code_review_id);

CREATE TRIGGER update_review_findings_updated_at
  BEFORE UPDATE ON public.review_findings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- 23. TEST CASES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL DEFAULT 'unit' CHECK (test_type IN ('unit', 'integration', 'e2e', 'security')),
  status TEXT NOT NULL DEFAULT 'passing' CHECK (status IN ('passing', 'failing', 'skipped', 'pending')),
  code TEXT,
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON public.test_cases(project_id);

CREATE TRIGGER update_test_cases_updated_at
  BEFORE UPDATE ON public.test_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- RLS POLICIES
--------------------------------------------------------------------------------
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;

-- Repositories Policies
CREATE POLICY "Repos access by project" ON public.repositories
  FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));

-- Repository Files Policies
CREATE POLICY "Repo files access by project" ON public.repository_files
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.repositories r WHERE r.id = repository_id AND public.is_project_member(r.project_id, auth.uid()::text)
  ));

-- Code Chunks Policies
CREATE POLICY "Code chunks access by project" ON public.code_chunks
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.repository_files rf
    JOIN public.repositories r ON r.id = rf.repository_id
    WHERE rf.id = repository_file_id AND public.is_project_member(r.project_id, auth.uid()::text)
  ));

-- AI Conversations Policies
CREATE POLICY "AI conversations access by project" ON public.ai_conversations
  FOR ALL USING (user_id = auth.uid()::text OR public.is_project_member(project_id, auth.uid()::text));

-- AI Messages Policies
CREATE POLICY "AI messages access by conversation" ON public.ai_messages
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid()::text OR public.is_project_member(c.project_id, auth.uid()::text))
  ));

-- Code Reviews & Findings Policies
CREATE POLICY "Code reviews access by project" ON public.code_reviews
  FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));

CREATE POLICY "Review findings access by review" ON public.review_findings
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.code_reviews cr WHERE cr.id = code_review_id AND public.is_project_member(cr.project_id, auth.uid()::text)
  ));

-- Test Cases Policies
CREATE POLICY "Test cases access by project" ON public.test_cases
  FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));
