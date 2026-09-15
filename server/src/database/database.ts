import type { ProjectFile } from '@/lib/templates';

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

/**
 * Client-side project operations — all go through the API routes.
 */

export async function saveProject(project: ProjectInsert): Promise<ProjectData> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save project');
  return data.data;
}

export async function updateProject(id: string, updates: ProjectUpdate): Promise<ProjectData> {
  const res = await fetch('/api/projects', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update project');
  return data.data;
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete project');
}

/**
 * Generic CRUD operations — used by the DataTable engine components.
 * All go through the generic /api/[resource] route.
 */

export async function fetchAll(resource: string, filter?: Record<string, any>) {
  const params = new URLSearchParams();
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      params.set(key, String(value));
    });
  }
  const res = await fetch(`/api/${resource}?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch');
  return data.data || [];
}

export async function fetchById(resource: string, id: string) {
  const res = await fetch(`/api/${resource}?id=${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch');
  return data.data;
}

export async function createRecord(resource: string, record: Record<string, unknown>) {
  const res = await fetch(`/api/${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create');
  return data.data;
}

export async function updateRecord(resource: string, id: string, record: Record<string, unknown>) {
  const res = await fetch(`/api/${resource}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...record }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update');
  return data.data;
}

export async function deleteRecord(resource: string, id: string) {
  const res = await fetch(`/api/${resource}?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete');
}

export async function countRecords(resource: string, filter?: Record<string, any>): Promise<number> {
  const params = new URLSearchParams({ count: 'true' });
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      params.set(key, String(value));
    });
  }
  const res = await fetch(`/api/${resource}?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to count');
  return data.count || 0;
}
