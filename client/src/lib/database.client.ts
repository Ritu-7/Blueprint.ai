import { createSupabaseClient } from '@/lib/supabase/client';
import type { DatabaseProject, ProjectInsert, ProjectUpdate } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, NotFoundError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logger/logger';

/**
 * Resolves a client-side Supabase instance.
 */
function getClientSupabase(clientOverride?: SupabaseClient): SupabaseClient {
  return clientOverride ?? createSupabaseClient();
}

export async function saveProject(project: ProjectInsert, client?: SupabaseClient): Promise<DatabaseProject> {
  const supabase = getClientSupabase(client);
  logger.info(`Saving new project: ${project.name}`, 'database.client');
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) {
    logger.error(`saveProject failed: ${error.message}`, 'database.client', error);
    throw new AppError(`Failed to save project: ${error.message}`, 500, 'DB_SAVE_ERROR', error);
  }
  return data as DatabaseProject;
}

export async function updateProject(id: string, updates: ProjectUpdate, client?: SupabaseClient): Promise<DatabaseProject> {
  const supabase = getClientSupabase(client);
  logger.info(`Updating project ${id}`, 'database.client');
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error(`updateProject failed for ${id}: ${error.message}`, 'database.client', error);
    throw new AppError(`Failed to update project: ${error.message}`, 500, 'DB_UPDATE_ERROR', error);
  }
  return data as DatabaseProject;
}

export async function fetchUserProjects(userId: string, client?: SupabaseClient): Promise<DatabaseProject[]> {
  const supabase = getClientSupabase(client);
  logger.info(`Fetching projects for user ${userId}`, 'database.client');
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    logger.error(`fetchUserProjects failed: ${error.message}`, 'database.client', error);
    throw new AppError(`Failed to fetch user projects: ${error.message}`, 500, 'DB_FETCH_ERROR', error);
  }
  return (data || []) as DatabaseProject[];
}

export async function fetchProjectById(id: string, client?: SupabaseClient): Promise<DatabaseProject> {
  const supabase = getClientSupabase(client);
  logger.info(`Fetching project ${id}`, 'database.client');
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    logger.warn(`Project ${id} not found`, 'database.client');
    throw new NotFoundError(`Project with ID ${id} not found`);
  }
  return data as DatabaseProject;
}

export async function deleteProject(id: string, client?: SupabaseClient): Promise<void> {
  const supabase = getClientSupabase(client);
  logger.info(`Deleting project ${id}`, 'database.client');
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error(`deleteProject failed for ${id}: ${error.message}`, 'database.client', error);
    throw new AppError(`Failed to delete project: ${error.message}`, 500, 'DB_DELETE_ERROR', error);
  }
}

export async function countRecords(resource: string, filter?: Record<string, unknown>, client?: SupabaseClient) {
  const supabase = getClientSupabase(client);
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
  const supabase = getClientSupabase(client);
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
  const supabase = getClientSupabase(client);
  const { data, error } = await supabase
    .from(resource as any)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRecord(resource: string, record: Record<string, unknown>, client?: SupabaseClient) {
  const supabase = getClientSupabase(client);
  const { data, error } = await supabase
    .from(resource as any)
    .insert(record as any)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateRecord(resource: string, id: string, record: Record<string, unknown>, client?: SupabaseClient) {
  const supabase = getClientSupabase(client);
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
  const supabase = getClientSupabase(client);
  const { error } = await supabase
    .from(resource as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
