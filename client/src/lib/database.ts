import { ProjectService } from '@/services/projectService';
import { createSupabaseClient } from '@/lib/supabase/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ProjectInsert, ProjectUpdate } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

async function getSupabase(clientOverride?: SupabaseClient): Promise<SupabaseClient> {
  if (clientOverride) return clientOverride;
  if (typeof window === 'undefined') {
    return await createServerSupabaseClient();
  }
  return createSupabaseClient();
}

export const saveProject = (project: ProjectInsert, client?: SupabaseClient) => ProjectService.saveProject(project, client);
export const updateProject = (id: string, updates: ProjectUpdate, client?: SupabaseClient) => ProjectService.updateProject(id, updates, client);
export const fetchUserProjects = (userId: string, client?: SupabaseClient) => ProjectService.fetchUserProjects(userId, client);
export const fetchProjectById = (id: string, client?: SupabaseClient) => ProjectService.fetchProjectById(id, client);
export const deleteProject = (id: string, client?: SupabaseClient) => ProjectService.deleteProject(id, client);

export async function countRecords(resource: string, filter?: Record<string, unknown>, client?: SupabaseClient) {
  const supabase = await getSupabase(client);
  let query = supabase.from(resource as any).select('*', { count: 'exact', head: true });

  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function fetchAll(resource: string, filter?: Record<string, unknown>, client?: SupabaseClient) {
  const supabase = await getSupabase(client);
  let query = supabase.from(resource as any).select('*');

  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchById(resource: string, id: string, client?: SupabaseClient) {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from(resource as any)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRecord(resource: string, record: Record<string, unknown>, client?: SupabaseClient) {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from(resource as any)
    .insert(record as any)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateRecord(resource: string, id: string, record: Record<string, unknown>, client?: SupabaseClient) {
  const supabase = await getSupabase(client);
  const { data, error } = await supabase
    .from(resource as any)
    .update(record as any)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteRecord(resource: string, id: string, client?: SupabaseClient) {
  const supabase = await getSupabase(client);
  const { error } = await supabase
    .from(resource as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
