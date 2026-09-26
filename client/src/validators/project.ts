import { z } from 'zod';
import type { ProjectStatus } from '@/types/database';

export const generatePromptSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
});

export const projectFileSchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1),
  language: z.enum(['tsx', 'ts', 'css', 'sql', 'json', 'md', 'js']),
  content: z.string(),
});

export const createProjectSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional().nullable().default(null),
  prompt: z.string().default(''),
  kind: z.string().nullable().default(null),
  ui_code: z.string().nullable().default(null),
  schema_code: z.string().nullable().default(null),
  api_code: z.string().nullable().default(null),
  readme_code: z.string().nullable().default(null),
  files: z.array(projectFileSchema).default([]),
  status: z.enum(['draft', 'generating', 'active', 'archived'] as const).default('active' as ProjectStatus),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().min(1, 'Project ID is required'),
});

export type GeneratePromptInput = z.infer<typeof generatePromptSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
