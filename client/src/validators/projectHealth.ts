import { z } from 'zod';

export const healthMetricSchema = z.object({
  requirementsCompletion: z.number().min(0).max(100),
  taskCompletion: z.number().min(0).max(100),
  apiCoverage: z.number().min(0).max(100),
  testCoverage: z.number().min(0).max(100),
  openSecurityFindings: z.number().min(0),
  prStatus: z.enum(['clean', 'open_prs', 'has_conflicts', 'no_repo']),
  documentationCoverage: z.number().min(0).max(100),
  buildStatus: z.enum(['passing', 'failing', 'warning']),
  openCodeReviewFindings: z.number().min(0),
});

export const healthSnapshotSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  timestamp: z.string(),
  overallHealthScore: z.number().min(0).max(100),

  // Calculated Category Scores (0-100)
  projectProgressScore: z.number().min(0).max(100),
  engineeringQualityScore: z.number().min(0).max(100),
  securityScore: z.number().min(0).max(100),
  testingScore: z.number().min(0).max(100),
  documentationScore: z.number().min(0).max(100),
  technicalDebtScore: z.number().min(0).max(100),

  // Raw Measurable Metrics
  metrics: healthMetricSchema,

  // Counts & Summaries
  totalRequirements: z.number(),
  completedRequirements: z.number(),
  totalTasks: z.number(),
  completedTasks: z.number(),
  totalApiEndpoints: z.number(),
  totalTestCases: z.number(),
  openSecurityIssuesCount: z.number(),
});

export const healthRecommendationSchema = z.object({
  category: z.enum([
    'Project Progress',
    'Engineering Quality',
    'Security',
    'Testing',
    'Documentation',
    'Technical Debt',
  ]),
  findingExplanation: z.string(),
  actionableRecommendation: z.string(),
  impact: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  referencedData: z.string(),
});

export const healthAnalysisResultSchema = z.object({
  snapshot: healthSnapshotSchema,
  recommendations: z.array(healthRecommendationSchema),
  trend: z.object({
    overallDelta: z.number(),
    progressDelta: z.number(),
    qualityDelta: z.number(),
    securityDelta: z.number(),
  }),
});

export type HealthMetric = z.infer<typeof healthMetricSchema>;
export type HealthSnapshot = z.infer<typeof healthSnapshotSchema>;
export type HealthRecommendation = z.infer<typeof healthRecommendationSchema>;
export type HealthAnalysisResult = z.infer<typeof healthAnalysisResultSchema>;
