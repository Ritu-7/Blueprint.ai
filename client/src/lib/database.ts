import { ProjectService } from '@/services/projectService';
import { supabaseClient } from '@/lib/supabase/client';
import type { ProjectInsert, ProjectUpdate } from '@/types/database';

export const saveProject = (project: ProjectInsert) => ProjectService.saveProject(project);
export const updateProject = (id: string, updates: ProjectUpdate) => ProjectService.updateProject(id, updates);
export const fetchUserProjects = (userId: string) => ProjectService.fetchUserProjects(userId);
export const fetchProjectById = (id: string) => ProjectService.fetchProjectById(id);
export const deleteProject = (id: string) => ProjectService.deleteProject(id);

export async function countRecords(resource: string, filter?: Record<string, unknown>) {
  let query = supabaseClient.from(resource as any).select('*', { count: 'exact', head: true });

  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function fetchAll(resource: string, filter?: Record<string, unknown>) {
  let query = supabaseClient.from(resource as any).select('*');

  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchById(resource: string, id: string) {
  const { data, error } = await supabaseClient
    .from(resource as any)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRecord(resource: string, record: Record<string, unknown>) {
  const { data, error } = await supabaseClient
    .from(resource as any)
    .insert(record as any)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateRecord(resource: string, id: string, record: Record<string, unknown>) {
  const { data, error } = await supabaseClient
    .from(resource as any)
    .update(record as any)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteRecord(resource: string, id: string) {
  const { error } = await supabaseClient
    .from(resource as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
