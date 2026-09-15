import { supabase } from './supabase';
import type { DatabaseProject, ProjectInsert, ProjectUpdate } from '@/types/database';

/**
 * PROJECT OPERATIONS
 */

export async function saveProject(project: ProjectInsert) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) {
    console.error('[db] saveProject error:', error.message, error.details, error.hint);
    throw error;
  }
  return data;
}

export async function updateProject(id: string, updates: ProjectUpdate) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[db] updateProject error:', error.message, error.details, error.hint);
    throw error;
  }
  return data;
}

export async function fetchUserProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchProjectById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function countRecords(resource: string, filter?: Record<string, any>) {
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

/**
 * GENERIC OPERATIONS
 */

export async function fetchAll(resource: string, filter?: Record<string, any>) {
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

export async function fetchById(resource: string, id: string) {
  const { data, error } = await supabase
    .from(resource as any)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRecord(resource: string, record: Record<string, unknown>) {
  const { data, error } = await supabase
    .from(resource as any)
    .insert(record as any)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateRecord(resource: string, id: string, record: Record<string, unknown>) {
  const { data, error } = await supabase
    .from(resource as any)
    .update(record as any)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteRecord(resource: string, id: string) {
  const { error } = await supabase
    .from(resource as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
