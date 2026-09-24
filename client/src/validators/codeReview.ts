import { z } from 'zod';

export const reviewCategoryEnum = z.enum([
  'Security',
  'Bug',
  'Performance',
  'Architecture',
  'Maintainability',
  'Code Quality',
  'Testing',
]);
export type ReviewCategory = z.infer<typeof reviewCategoryEnum>;

export const findingStatusEnum = z.enum(['OPEN', 'DISMISSED', 'RESOLVED']);
export type FindingStatus = z.infer<typeof findingStatusEnum>;

export const reviewSeverityEnum = z.enum(['critical', 'high', 'medium', 'low', 'info']);
export type ReviewSeverity = z.infer<typeof reviewSeverityEnum>;

export const startReviewSchema = z.object({
  projectId: z.string().uuid().optional(),
  owner: z.string().trim().min(1, 'Owner is required'),
  repo: z.string().trim().min(1, 'Repository is required'),
  branch: z.string().default('main'),
  targetType: z.enum(['repository', 'pull_request', 'commit', 'selected_files']).default('repository'),
  prNumber: z.coerce.number().optional(),
  commitSha: z.string().optional(),
  filePaths: z.array(z.string()).optional(),
});

export const reviewFindingSchema = z.object({
  id: z.string(),
  severity: reviewSeverityEnum,
  category: reviewCategoryEnum,
  file: z.string(),
  line: z.coerce.number().optional().default(1),
  title: z.string(),
  description: z.string(),
  recommendation: z.string(),
  status: findingStatusEnum.default('OPEN'),
});

export const codeReviewResultSchema = z.object({
  prSummary: z.string(),
  riskAssessment: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  overallScore: z.number().min(0).max(100),
  categories: z.object({
    security: z.number().min(0).max(100),
    bugs: z.number().min(0).max(100),
    performance: z.number().min(0).max(100),
    architecture: z.number().min(0).max(100),
    maintainability: z.number().min(0).max(100),
    codeQuality: z.number().min(0).max(100),
    testing: z.number().min(0).max(100),
  }),
  findings: z.array(reviewFindingSchema),
  testRecommendations: z.array(z.string()),
  positiveNotes: z.array(z.string()),
});

export const updateFindingStatusSchema = z.object({
  reviewId: z.string(),
  findingId: z.string(),
  status: findingStatusEnum,
});

export type StartReviewInput = z.infer<typeof startReviewSchema>;
export type ReviewFinding = z.infer<typeof reviewFindingSchema>;
export type CodeReviewResult = z.infer<typeof codeReviewResultSchema>;
export type UpdateFindingStatusInput = z.infer<typeof updateFindingStatusSchema>;

export interface ReviewJob {
  jobId: string;
  projectId?: string;
  owner: string;
  repo: string;
  branch: string;
  targetType: 'repository' | 'pull_request' | 'commit' | 'selected_files';
  prNumber?: number;
  commitSha?: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  progress: number;
  progressMessage: string;
  result?: CodeReviewResult;
  error?: string;
  startedAt: string;
  completedAt?: string;
}
