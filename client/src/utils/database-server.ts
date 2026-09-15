import { connectDB } from './db';
import ProjectModel from '@/models/Project';
import type { ProjectFile, TemplateKind } from '@/lib/templates';

export type ProjectInsert = {
  user_id: string;
  name: string;
  description?: string;
  prompt?: string;
  kind?: string;
  ui_code?: string;
  schema_code?: string;
  api_code?: string;
  readme_code?: string;
  files?: ProjectFile[];
  status?: string;
};

export type ProjectUpdate = Partial<ProjectInsert>;

export type ProjectData = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  prompt: string;
  kind: string;
  ui_code: string;
  schema_code: string;
  api_code: string;
  readme_code: string;
  files: ProjectFile[];
  status: string;
  created_at: string;
  updated_at: string;
};

function toProjectData(doc: any): ProjectData {
  return {
    id: String(doc._id),
    user_id: doc.user_id,
    name: doc.name,
    description: doc.description || '',
    prompt: doc.prompt || '',
    kind: doc.kind || 'todo',
    ui_code: doc.ui_code || '',
    schema_code: doc.schema_code || '',
    api_code: doc.api_code || '',
    readme_code: doc.readme_code || '',
    files: doc.files || [],
    status: doc.status || 'active',
    created_at: doc.createdAt?.toISOString?.() || doc.created_at || new Date().toISOString(),
    updated_at: doc.updatedAt?.toISOString?.() || doc.updated_at || new Date().toISOString(),
  };
}

export async function saveProject(project: ProjectInsert): Promise<ProjectData> {
  await connectDB();
  const doc = await ProjectModel.create(project);
  return toProjectData(doc);
}

export async function updateProject(id: string, updates: ProjectUpdate): Promise<ProjectData> {
  await connectDB();
  const doc = await ProjectModel.findByIdAndUpdate(id, updates, { new: true });
  if (!doc) throw new Error('Project not found');
  return toProjectData(doc);
}

export async function fetchUserProjects(userId: string): Promise<ProjectData[]> {
  await connectDB();
  const docs = await ProjectModel.find({ user_id: userId }).sort({ updatedAt: -1 }).limit(6).lean();
  return docs.map(toProjectData);
}

export async function fetchProjectById(id: string): Promise<ProjectData | null> {
  await connectDB();
  const doc = await ProjectModel.findById(id).lean();
  return doc ? toProjectData(doc) : null;
}

export async function deleteProject(id: string): Promise<void> {
  await connectDB();
  await ProjectModel.findByIdAndDelete(id);
}
