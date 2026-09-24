import { z } from 'zod';

export const startReviewSchema = z.object({
  owner: z.string().trim().min(1, 'Owner is required'),
  repo: z.string().trim().min(1, 'Repository is required'),
  branch: z.string().default('main'),
  projectId: z.string().uuid().optional(),
});

export const reviewFindingSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  file: z.string().optional().nullable(),
  lineHint: z.string().optional().nullable(),
  suggestion: z.string(),
});

export const codeReviewResultSchema = z.object({
  summary: z.string(),
  overallScore: z.number().min(0).max(100),
  categories: z.object({
    codeQuality: z.number().min(0).max(100),
    security: z.number().min(0).max(100),
    performance: z.number().min(0).max(100),
    maintainability: z.number().min(0).max(100),
    testCoverage: z.number().min(0).max(100),
  }),
  findings: z.array(reviewFindingSchema),
  positives: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type StartReviewInput = z.infer<typeof startReviewSchema>;
export type ReviewFinding = z.infer<typeof reviewFindingSchema>;
export type CodeReviewResult = z.infer<typeof codeReviewResultSchema>;

export interface ReviewJob {
  jobId: string;
  projectId?: string;
  owner: string;
  repo: string;
  branch: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  progress: number;
  progressMessage: string;
  result?: CodeReviewResult;
  error?: string;
  startedAt: string;
  completedAt?: string;
}
