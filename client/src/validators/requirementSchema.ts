import { z } from 'zod';

export const requirementTypeEnum = z.enum([
  'FUNCTIONAL',
  'NON_FUNCTIONAL',
  'SECURITY',
  'PERFORMANCE',
  'BUSINESS',
]);

export const requirementPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const requirementStatusEnum = z.enum([
  'DRAFT',
  'TODO',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
]);

export const requirementSchema = z.object({
  id: z.string().optional(),
  project_id: z.string().min(1, 'Project ID is required'),
  blueprint_id: z.string().nullable().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  type: requirementTypeEnum.default('FUNCTIONAL'),
  priority: requirementPriorityEnum.default('MEDIUM'),
  status: requirementStatusEnum.default('TODO'),
  user_story: z.string().default(''),
  acceptance_criteria: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const createRequirementSchema = requirementSchema.omit({ id: true, created_at: true, updated_at: true });
export const updateRequirementSchema = createRequirementSchema.partial().extend({
  id: z.string().min(1, 'Requirement ID is required'),
});

export type RequirementType = z.infer<typeof requirementTypeEnum>;
export type RequirementPriority = z.infer<typeof requirementPriorityEnum>;
export type RequirementStatus = z.infer<typeof requirementStatusEnum>;
export type Requirement = z.infer<typeof requirementSchema>;
export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;
