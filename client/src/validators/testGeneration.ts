import { z } from 'zod';

export const testTypeEnum = z.enum(['unit', 'api', 'integration']);
export type TestType = z.infer<typeof testTypeEnum>;

export const testCoverageCategoryEnum = z.enum([
  'Happy Path',
  'Validation',
  'Authentication',
  'Authorization',
  'Edge Cases',
  'Failures',
  'Security',
]);
export type TestCoverageCategory = z.infer<typeof testCoverageCategoryEnum>;

export const generateTestsSchema = z.object({
  projectId: z.string().uuid().optional(),
  testType: testTypeEnum.default('unit'),
  coverageCategories: z.array(testCoverageCategoryEnum).default([
    'Happy Path',
    'Validation',
    'Authentication',
    'Authorization',
    'Edge Cases',
    'Failures',
    'Security',
  ]),
  targetModule: z.string().optional(), // e.g. "Auth Service", "Project API", "Database Schema"
  customInstructions: z.string().optional(),
});

export const generatedTestCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  testType: testTypeEnum,
  category: testCoverageCategoryEnum,
  scenario: z.string(),
  expectedResult: z.string(),
  targetFile: z.string(),
  testCode: z.string(),
  status: z.enum(['passing', 'failing', 'pending', 'skipped', 'running']).default('pending'),
  duration: z.string().optional(),
});

export const generatedTestSuiteSchema = z.object({
  summary: z.string(),
  testType: testTypeEnum,
  totalCases: z.number(),
  estimatedCoverage: z.number(),
  testFramework: z.string(),
  testCases: z.array(generatedTestCaseSchema),
  suiteCode: z.string(),
});

export type GenerateTestsInput = z.infer<typeof generateTestsSchema>;
export type GeneratedTestCase = z.infer<typeof generatedTestCaseSchema>;
export type GeneratedTestSuite = z.infer<typeof generatedTestSuiteSchema>;
