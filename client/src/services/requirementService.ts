import { supabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger/logger';
import { AppError, NotFoundError } from '@/lib/errors/AppError';
import { AIService } from './aiService';
import type { Requirement, CreateRequirementInput, UpdateRequirementInput } from '@/validators/requirementSchema';

export class RequirementService {
  static async fetchProjectRequirements(projectId: string): Promise<Requirement[]> {
    logger.info(`Fetching requirements for project ${projectId}`, 'requirementService');
    const { data, error } = await supabaseClient
      .from('requirements')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`fetchProjectRequirements error: ${error.message}`, 'requirementService', error);
      throw new AppError(`Failed to fetch requirements: ${error.message}`, 500, 'DB_FETCH_ERROR');
    }

    return (data || []).map((row) => ({
      id: row.id,
      project_id: row.project_id,
      blueprint_id: row.blueprint_id,
      title: row.title,
      description: row.description || '',
      type: (row.category || row.type || 'FUNCTIONAL').toUpperCase() as any,
      priority: (row.priority || 'MEDIUM').toUpperCase() as any,
      status: (row.status || 'TODO').toUpperCase() as any,
      user_story: row.user_story || '',
      acceptance_criteria: Array.isArray(row.acceptance_criteria) ? row.acceptance_criteria : [],
      dependencies: Array.isArray(row.dependencies) ? row.dependencies : [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  static async createRequirement(input: CreateRequirementInput): Promise<Requirement> {
    logger.info(`Creating requirement "${input.title}" for project ${input.project_id}`, 'requirementService');
    const { data, error } = await supabaseClient
      .from('requirements')
      .insert({
        project_id: input.project_id,
        blueprint_id: input.blueprint_id || null,
        title: input.title,
        description: input.description,
        priority: input.priority.toLowerCase(),
        status: input.status.toLowerCase(),
        category: input.type,
        user_story: input.user_story,
        acceptance_criteria: input.acceptance_criteria as any,
        dependencies: input.dependencies as any,
      })
      .select()
      .single();

    if (error || !data) {
      logger.error(`createRequirement error: ${error?.message}`, 'requirementService', error);
      throw new AppError(`Failed to create requirement: ${error?.message}`, 500, 'DB_INSERT_ERROR');
    }

    return {
      id: data.id,
      project_id: data.project_id,
      blueprint_id: data.blueprint_id,
      title: data.title,
      description: data.description || '',
      type: (data.category || 'FUNCTIONAL').toUpperCase() as any,
      priority: (data.priority || 'MEDIUM').toUpperCase() as any,
      status: (data.status || 'TODO').toUpperCase() as any,
      user_story: data.user_story || '',
      acceptance_criteria: Array.isArray(data.acceptance_criteria) ? data.acceptance_criteria : [],
      dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  static async updateRequirement(id: string, updates: Partial<CreateRequirementInput>): Promise<Requirement> {
    logger.info(`Updating requirement ${id}`, 'requirementService');
    const dbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.type !== undefined) dbUpdates.category = updates.type;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority.toLowerCase();
    if (updates.status !== undefined) dbUpdates.status = updates.status.toLowerCase();
    if (updates.user_story !== undefined) dbUpdates.user_story = updates.user_story;
    if (updates.acceptance_criteria !== undefined) dbUpdates.acceptance_criteria = updates.acceptance_criteria;
    if (updates.dependencies !== undefined) dbUpdates.dependencies = updates.dependencies;

    const { data, error } = await supabaseClient
      .from('requirements')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      logger.error(`updateRequirement error: ${error?.message}`, 'requirementService', error);
      throw new AppError(`Failed to update requirement: ${error?.message}`, 500, 'DB_UPDATE_ERROR');
    }

    return {
      id: data.id,
      project_id: data.project_id,
      blueprint_id: data.blueprint_id,
      title: data.title,
      description: data.description || '',
      type: (data.category || 'FUNCTIONAL').toUpperCase() as any,
      priority: (data.priority || 'MEDIUM').toUpperCase() as any,
      status: (data.status || 'TODO').toUpperCase() as any,
      user_story: data.user_story || '',
      acceptance_criteria: Array.isArray(data.acceptance_criteria) ? data.acceptance_criteria : [],
      dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  static async deleteRequirement(id: string): Promise<void> {
    logger.info(`Deleting requirement ${id}`, 'requirementService');
    const { error } = await supabaseClient.from('requirements').delete().eq('id', id);
    if (error) {
      logger.error(`deleteRequirement error: ${error.message}`, 'requirementService', error);
      throw new AppError(`Failed to delete requirement: ${error.message}`, 500, 'DB_DELETE_ERROR');
    }
  }

  static async generateRequirementsForProject(projectId: string, prompt?: string): Promise<Requirement[]> {
    logger.info(`Generating requirements for project ${projectId}`, 'requirementService');

    // Fetch existing project to get prompt context
    const { data: project } = await supabaseClient.from('projects').select('name, prompt, kind').eq('id', projectId).single();
    const activePrompt = prompt || project?.prompt || 'Full-stack application blueprint';

    const blueprint = AIService.generateProject(activePrompt);

    // Build structured requirement records from 12-section blueprint
    const generatedList: CreateRequirementInput[] = [
      ...blueprint.functionalRequirements.map((fr) => ({
        project_id: projectId,
        title: `${fr.id}: ${fr.category} Specification`,
        description: fr.description,
        type: 'FUNCTIONAL' as const,
        priority: 'HIGH' as const,
        status: 'TODO' as const,
        user_story: `As a user, I want ${fr.description.toLowerCase()} so that the system operates correctly.`,
        acceptance_criteria: [
          `Verified functionality of ${fr.category}`,
          'Zero unhandled errors on edge cases',
        ],
        dependencies: [],
      })),
      ...blueprint.nonFunctionalRequirements.map((nfr, idx) => ({
        project_id: projectId,
        title: `NFR-${idx + 1}: ${nfr.category} Requirement`,
        description: nfr.requirement,
        type: nfr.category.toUpperCase().includes('SEC') ? ('SECURITY' as const) : nfr.category.toUpperCase().includes('PERF') ? ('PERFORMANCE' as const) : ('NON_FUNCTIONAL' as const),
        priority: 'CRITICAL' as const,
        status: 'IN_PROGRESS' as const,
        user_story: `As an administrator, I want ${nfr.requirement.toLowerCase()} so that the workspace remains robust.`,
        acceptance_criteria: ['System meets target performance benchmarks', 'Security audit passes'],
        dependencies: [],
      })),
      ...blueprint.userStories.map((us, idx) => ({
        project_id: projectId,
        title: `US-${idx + 1}: As a ${us.asA}`,
        description: `I want to ${us.iWantTo} so that ${us.soThat}.`,
        type: 'BUSINESS' as const,
        priority: 'MEDIUM' as const,
        status: 'TODO' as const,
        user_story: `As a ${us.asA}, I want to ${us.iWantTo}, so that ${us.soThat}.`,
        acceptance_criteria: ['User story scenario validated', 'UI component renders state'],
        dependencies: [],
      })),
    ];

    // Insert all generated requirements into Supabase
    const savedRequirements: Requirement[] = [];
    for (const reqInput of generatedList) {
      const saved = await this.createRequirement(reqInput);
      savedRequirements.push(saved);
    }

    logger.info(`Generated and saved ${savedRequirements.length} requirements`, 'requirementService');
    return savedRequirements;
  }
}
