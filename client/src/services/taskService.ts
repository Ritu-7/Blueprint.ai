import { supabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger/logger';
import { AppError } from '@/lib/errors/AppError';
import { AIService } from './aiService';
import type { TaskItem, CreateTaskInput } from '@/validators/taskSchema';

export class TaskService {
  static async fetchProjectTasks(projectId: string): Promise<TaskItem[]> {
    logger.info(`Fetching development tasks for project ${projectId}`, 'taskService');
    const { data, error } = await supabaseClient
      .from('development_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`fetchProjectTasks error: ${error.message}`, 'taskService', error);
      throw new AppError(`Failed to fetch tasks: ${error.message}`, 500, 'DB_FETCH_ERROR');
    }

    return (data || []).map((row) => {
      const meta = (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, any>;
      return {
        id: row.id,
        project_id: row.project_id,
        title: row.title,
        description: row.description || '',
        category: (meta.category || 'FRONTEND').toUpperCase() as any,
        priority: (row.priority || 'MEDIUM').toUpperCase() as any,
        complexity: (meta.complexity || 'M').toUpperCase() as any,
        dependencies: Array.isArray(meta.dependencies) ? meta.dependencies : [],
        related_requirement: meta.related_requirement || '',
        status: (row.status || 'TODO').toUpperCase() as any,
        assignee: meta.assignee || null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });
  }

  static async createTask(input: CreateTaskInput): Promise<TaskItem> {
    logger.info(`Creating task "${input.title}" for project ${input.project_id}`, 'taskService');
    const metadata = {
      category: input.category,
      complexity: input.complexity,
      dependencies: input.dependencies,
      related_requirement: input.related_requirement,
      assignee: input.assignee,
    };

    const { data, error } = await supabaseClient
      .from('development_tasks')
      .insert({
        project_id: input.project_id,
        title: input.title,
        description: input.description,
        priority: input.priority.toLowerCase(),
        status: input.status.toLowerCase(),
        metadata,
      })
      .select()
      .single();

    if (error || !data) {
      logger.error(`createTask error: ${error?.message}`, 'taskService', error);
      throw new AppError(`Failed to create task: ${error?.message}`, 500, 'DB_INSERT_ERROR');
    }

    return {
      id: data.id,
      project_id: data.project_id,
      title: data.title,
      description: data.description || '',
      category: input.category,
      priority: input.priority,
      complexity: input.complexity,
      dependencies: input.dependencies,
      related_requirement: input.related_requirement,
      status: input.status,
      assignee: input.assignee,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  static async updateTask(id: string, updates: Partial<CreateTaskInput>): Promise<TaskItem> {
    logger.info(`Updating task ${id}`, 'taskService');

    // Fetch existing record to merge metadata
    const { data: existing } = await supabaseClient.from('development_tasks').select('*').eq('id', id).single();
    const currentMeta = (existing?.metadata && typeof existing.metadata === 'object' ? existing.metadata : {}) as Record<string, any>;

    const dbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority.toLowerCase();
    if (updates.status !== undefined) dbUpdates.status = updates.status.toLowerCase();

    const newMeta = {
      ...currentMeta,
      ...(updates.category ? { category: updates.category } : {}),
      ...(updates.complexity ? { complexity: updates.complexity } : {}),
      ...(updates.dependencies ? { dependencies: updates.dependencies } : {}),
      ...(updates.related_requirement ? { related_requirement: updates.related_requirement } : {}),
      ...(updates.assignee !== undefined ? { assignee: updates.assignee } : {}),
    };
    dbUpdates.metadata = newMeta;

    const { data, error } = await supabaseClient
      .from('development_tasks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      logger.error(`updateTask error: ${error?.message}`, 'taskService', error);
      throw new AppError(`Failed to update task: ${error?.message}`, 500, 'DB_UPDATE_ERROR');
    }

    return {
      id: data.id,
      project_id: data.project_id,
      title: data.title,
      description: data.description || '',
      category: (newMeta.category || 'FRONTEND').toUpperCase() as any,
      priority: (data.priority || 'MEDIUM').toUpperCase() as any,
      complexity: (newMeta.complexity || 'M').toUpperCase() as any,
      dependencies: Array.isArray(newMeta.dependencies) ? newMeta.dependencies : [],
      related_requirement: newMeta.related_requirement || '',
      status: (data.status || 'TODO').toUpperCase() as any,
      assignee: newMeta.assignee || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  static async deleteTask(id: string): Promise<void> {
    logger.info(`Deleting task ${id}`, 'taskService');
    const { error } = await supabaseClient.from('development_tasks').delete().eq('id', id);
    if (error) {
      logger.error(`deleteTask error: ${error.message}`, 'taskService', error);
      throw new AppError(`Failed to delete task: ${error.message}`, 500, 'DB_DELETE_ERROR');
    }
  }

  static async generateTasksForProject(projectId: string): Promise<TaskItem[]> {
    logger.info(`Generating implementation tasks for project ${projectId}`, 'taskService');

    const { data: project } = await supabaseClient.from('projects').select('name, prompt, kind').eq('id', projectId).single();
    const prompt = project?.prompt || 'Full-stack application workspace';

    const blueprint = AIService.generateProject(prompt);

    const generatedList: CreateTaskInput[] = [
      {
        project_id: projectId,
        title: 'Initialize Next.js 14 App Router workspace & environment validation',
        description: 'Set up project structure, Zod env validation schema, and Clerk authentication provider.',
        category: 'SETUP',
        priority: 'CRITICAL',
        complexity: 'S',
        dependencies: [],
        related_requirement: 'FR-01: Auth & Environment',
        status: 'DONE',
        assignee: 'Lead Engineer',
      },
      {
        project_id: projectId,
        title: 'Implement Supabase PostgreSQL RLS schema & migration script',
        description: 'Create multi-tenant database tables, foreign keys, indexes, and RLS security functions.',
        category: 'DATABASE',
        priority: 'CRITICAL',
        complexity: 'M',
        dependencies: ['SETUP'],
        related_requirement: 'FR-02: Row Level Security',
        status: 'DONE',
        assignee: 'Database Architect',
      },
      {
        project_id: projectId,
        title: 'Develop responsive Live Browser Preview & FileExplorer IDE',
        description: 'Render generated TSX components with viewport controls, tab switching, and code copying.',
        category: 'FRONTEND',
        priority: 'HIGH',
        complexity: 'L',
        dependencies: ['SETUP'],
        related_requirement: 'FR-03: IDE Interface',
        status: 'IN_PROGRESS',
        assignee: 'Frontend Engineer',
      },
      {
        project_id: projectId,
        title: 'Build REST API endpoints & AIService structured generator',
        description: 'Implement /api/generate, /api/projects, /api/requirements with Zod validation and handleApiError.',
        category: 'BACKEND',
        priority: 'CRITICAL',
        complexity: 'L',
        dependencies: ['DATABASE'],
        related_requirement: 'FR-04: API Engine',
        status: 'IN_PROGRESS',
        assignee: 'Backend Engineer',
      },
      {
        project_id: projectId,
        title: 'Configure GitHub REST API push & PR automation modal',
        description: 'Implement blob creation, tree commit, and pull request triggers for user repositories.',
        category: 'DEVOPS',
        priority: 'HIGH',
        complexity: 'M',
        dependencies: ['BACKEND'],
        related_requirement: 'FR-05: GitHub Integration',
        status: 'REVIEW',
        assignee: 'DevOps Engineer',
      },
      {
        project_id: projectId,
        title: 'Integrate Google Gemini AI structured JSON blueprint engine',
        description: 'Connect Gemini API in structured mode with server-side local fallback.',
        category: 'AI',
        priority: 'HIGH',
        complexity: 'L',
        dependencies: ['BACKEND'],
        related_requirement: 'FR-06: AI Generator',
        status: 'TODO',
        assignee: 'AI Engineer',
      },
      {
        project_id: projectId,
        title: 'Run automated E2E test suite & vulnerability audit',
        description: 'Execute tsc typecheck, next lint, and production build checks across all 29 routes.',
        category: 'TESTING',
        priority: 'MEDIUM',
        complexity: 'S',
        dependencies: ['FRONTEND', 'BACKEND'],
        related_requirement: 'NFR-01: Reliability',
        status: 'BACKLOG',
        assignee: 'QA Engineer',
      },
      {
        project_id: projectId,
        title: 'Publish technical README documentation & API specs',
        description: 'Document architecture components, database tables, and REST API contract endpoints.',
        category: 'DOCUMENTATION',
        priority: 'LOW',
        complexity: 'S',
        dependencies: ['TESTING'],
        related_requirement: 'NFR-02: Documentation',
        status: 'BACKLOG',
        assignee: 'Technical Writer',
      },
    ];

    const savedTasks: TaskItem[] = [];
    for (const taskInput of generatedList) {
      const saved = await this.createTask(taskInput);
      savedTasks.push(saved);
    }

    logger.info(`Generated and saved ${savedTasks.length} implementation tasks`, 'taskService');
    return savedTasks;
  }
}
