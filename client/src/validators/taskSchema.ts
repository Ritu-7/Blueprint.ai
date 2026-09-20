import { z } from 'zod';

export const taskCategoryEnum = z.enum([
  'SETUP',
  'FRONTEND',
  'BACKEND',
  'DATABASE',
  'AUTH',
  'AI',
  'TESTING',
  'DEVOPS',
  'DOCUMENTATION',
]);

export const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const taskComplexityEnum = z.enum(['S', 'M', 'L', 'XL']);
export const taskStatusEnum = z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']);

export const taskSchema = z.object({
  id: z.string().optional(),
  project_id: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  category: taskCategoryEnum.default('FRONTEND'),
  priority: taskPriorityEnum.default('MEDIUM'),
  complexity: taskComplexityEnum.default('M'),
  dependencies: z.array(z.string()).default([]),
  related_requirement: z.string().default(''),
  status: taskStatusEnum.default('TODO'),
  assignee: z.string().nullable().default(null),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const createTaskSchema = taskSchema.omit({ id: true, created_at: true, updated_at: true });
export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().min(1, 'Task ID is required'),
});

export type TaskCategory = z.infer<typeof taskCategoryEnum>;
export type TaskPriority = z.infer<typeof taskPriorityEnum>;
export type TaskComplexity = z.infer<typeof taskComplexityEnum>;
export type TaskStatus = z.infer<typeof taskStatusEnum>;
export type TaskItem = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
