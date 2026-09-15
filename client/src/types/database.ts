import type { ProjectFile } from '@/lib/templates';

export type ProjectStatus = 'draft' | 'generating' | 'active' | 'archived';

export interface DatabaseProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt: string;
  kind: string | null;
  ui_code: string | null;
  schema_code: string | null;
  api_code: string | null;
  readme_code: string | null;
  files: ProjectFile[];
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = Omit<DatabaseProject, 'id' | 'created_at' | 'updated_at'>;
export type ProjectUpdate = Partial<ProjectInsert>;
