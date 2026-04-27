import { supabase } from './supabase';
import type { AppConfig } from '@/config/schema';

export function getTableNames(config: AppConfig): string[] {
  return Object.keys(config.schema);
}

export function getTableFields(config: AppConfig, tableName: string) {
  return config.schema[tableName]?.fields || {};
}

export async function fetchAll(resource: string, filter?: Record<string, unknown>) {
  let query = supabase.from(resource).select('*');

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
    .from(resource)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRecord(resource: string, record: Record<string, unknown>) {
  const { data, error } = await supabase
    .from(resource)
    .insert(record)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateRecord(resource: string, id: string, record: Record<string, unknown>) {
  const { data, error } = await supabase
    .from(resource)
    .update(record)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteRecord(resource: string, id: string) {
  const { error } = await supabase
    .from(resource)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function countRecords(resource: string, filter?: Record<string, unknown>) {
  let query = supabase.from(resource).select('*', { count: 'exact', head: true });

  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}
