import { z } from 'zod';

export const jobStateEnum = z.enum(['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']);
export type JobState = z.infer<typeof jobStateEnum>;

export const jobTypeEnum = z.enum([
  'REPOSITORY_ANALYSIS',
  'EMBEDDING_GENERATION',
  'BLUEPRINT_GENERATION',
  'CODE_REVIEW',
]);
export type JobType = z.infer<typeof jobTypeEnum>;

export const createJobSchema = z.object({
  projectId: z.string().uuid().optional(),
  type: jobTypeEnum,
  payload: z.record(z.unknown()),
  maxRetries: z.number().int().min(0).max(5).default(3),
});

export const jobLogEntrySchema = z.object({
  timestamp: z.string(),
  progress: z.number(),
  message: z.string(),
});

export const jobStatusSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  type: jobTypeEnum,
  state: jobStateEnum,
  progress: z.number().min(0).max(100),
  attemptsMade: z.number(),
  maxRetries: z.number(),
  error: z.string().optional(),
  result: z.unknown().optional(),
  createdAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  logs: z.array(jobLogEntrySchema),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type JobLogEntry = z.infer<typeof jobLogEntrySchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
