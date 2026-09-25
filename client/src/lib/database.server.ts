import { ProjectService } from '@/services/projectService';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ProjectInsert, ProjectUpdate } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolves a server-side Supabase instance using Clerk's auth() from @clerk/nextjs/server.
 */
async function getServerSupabase(clientOverride?: SupabaseClient): Promise<SupabaseClient> {
  if (clientOverride) return clientOverride;
  return await createServerSupabaseClient();
}

export const saveProjectServer = async (project: ProjectInsert, client?: SupabaseClient) =>
  ProjectService.saveProject(project, await getServerSupabase(client));

export const updateProjectServer = async (id: string, updates: ProjectUpdate, client?: SupabaseClient) =>
  ProjectService.updateProject(id, updates, await getServerSupabase(client));

export const fetchUserProjectsServer = async (userId: string, client?: SupabaseClient) =>
  ProjectService.fetchUserProjects(userId, await getServerSupabase(client));

export const fetchProjectByIdServer = async (id: string, client?: SupabaseClient) =>
  ProjectService.fetchProjectById(id, await getServerSupabase(client));

export const deleteProjectServer = async (id: string, client?: SupabaseClient) =>
  ProjectService.deleteProject(id, await getServerSupabase(client));

export async function countRecordsServer(resource: string, filter?: Record<string, unknown>, client?: SupabaseClient) {
  const supabase = await getServerSupabase(client);
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

export async function fetchAllServer(resource: string, filter?: Record<string, unknown>, client?: SupabaseClient) {
  const supabase = await getServerSupabase(client);
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

export async function fetchByIdServer(resource: string, id: string, client?: SupabaseClient) {
  const supabase = await getServerSupabase(client);
  const { data, error } = await supabase
    .from(resource as any)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRecordServer(resource: string, record: Record<string, unknown>, client?: SupabaseClient) {
  const supabase = await getServerSupabase(client);
  const { data, error } = await supabase
    .from(resource as any)
    .insert(record as any)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateRecordServer(resource: string, id: string, record: Record<string, unknown>, client?: SupabaseClient) {
  const supabase = await getServerSupabase(client);
  const { data, error } = await supabase
    .from(resource as any)
    .update(record as any)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteRecordServer(resource: string, id: string, client?: SupabaseClient) {
  const supabase = await getServerSupabase(client);
  const { error } = await supabase
    .from(resource as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
