import { supabaseClient } from '@/lib/supabase/client';
import type { DatabaseProject, ProjectInsert, ProjectUpdate } from '@/types/database';
import { NotFoundError, AppError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logger/logger';

export class ProjectService {
  static async saveProject(project: ProjectInsert): Promise<DatabaseProject> {
    logger.info(`Saving new project: ${project.name}`, 'projectService');
    const { data, error } = await supabaseClient
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) {
      logger.error(`saveProject failed: ${error.message}`, 'projectService', error);
      throw new AppError(`Failed to save project: ${error.message}`, 500, 'DB_SAVE_ERROR', error);
    }
    return data as DatabaseProject;
  }

  static async updateProject(id: string, updates: ProjectUpdate): Promise<DatabaseProject> {
    logger.info(`Updating project ${id}`, 'projectService');
    const { data, error } = await supabaseClient
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error(`updateProject failed for ${id}: ${error.message}`, 'projectService', error);
      throw new AppError(`Failed to update project: ${error.message}`, 500, 'DB_UPDATE_ERROR', error);
    }
    return data as DatabaseProject;
  }

  static async fetchUserProjects(userId: string): Promise<DatabaseProject[]> {
    logger.info(`Fetching projects for user ${userId}`, 'projectService');
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error(`fetchUserProjects failed: ${error.message}`, 'projectService', error);
      throw new AppError(`Failed to fetch user projects: ${error.message}`, 500, 'DB_FETCH_ERROR', error);
    }
    return (data || []) as DatabaseProject[];
  }

  static async fetchProjectById(id: string): Promise<DatabaseProject> {
    logger.info(`Fetching project ${id}`, 'projectService');
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      logger.warn(`Project ${id} not found`, 'projectService');
      throw new NotFoundError(`Project with ID ${id} not found`);
    }
    return data as DatabaseProject;
  }

  static async deleteProject(id: string): Promise<void> {
    logger.info(`Deleting project ${id}`, 'projectService');
    const { error } = await supabaseClient
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error(`deleteProject failed for ${id}: ${error.message}`, 'projectService', error);
      throw new AppError(`Failed to delete project: ${error.message}`, 500, 'DB_DELETE_ERROR', error);
    }
  }
}
