import { z } from 'zod';
import { projectFileSchema } from './project';

export const overviewSchema = z.object({
  title: z.string(),
  tagline: z.string(),
  description: z.string(),
});

export const problemStatementSchema = z.object({
  coreProblem: z.string(),
  painPoints: z.array(z.string()),
});

export const userRoleSchema = z.object({
  role: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
});

export const coreFeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

export const functionalRequirementSchema = z.object({
  id: z.string(),
  category: z.string(),
  description: z.string(),
});

export const nonFunctionalRequirementSchema = z.object({
  category: z.string(),
  requirement: z.string(),
});

export const userStorySchema = z.object({
  asA: z.string(),
  iWantTo: z.string(),
  soThat: z.string(),
});

export const mainWorkflowSchema = z.object({
  name: z.string(),
  steps: z.array(z.string()),
});

export const techStackSchema = z.object({
  frontend: z.array(z.string()),
  backend: z.array(z.string()),
  database: z.array(z.string()),
  auth: z.array(z.string()),
  hosting: z.array(z.string()),
});

export const developmentPhaseSchema = z.object({
  phase: z.string(),
  title: z.string(),
  deliverables: z.array(z.string()),
});

export const potentialRiskSchema = z.object({
  risk: z.string(),
  impact: z.enum(['low', 'medium', 'high']),
  mitigation: z.string(),
});

export const fullBlueprintSchema = z.object({
  name: z.string(),
  kind: z.enum(['todo', 'ecommerce', 'dashboard', 'portfolio', 'chat', 'crm']),
  description: z.string(),
  overview: overviewSchema,
  problemStatement: problemStatementSchema,
  targetUsers: z.array(z.string()),
  userRoles: z.array(userRoleSchema),
  coreFeatures: z.array(coreFeatureSchema),
  functionalRequirements: z.array(functionalRequirementSchema),
  nonFunctionalRequirements: z.array(nonFunctionalRequirementSchema),
  userStories: z.array(userStorySchema),
  mainWorkflows: z.array(mainWorkflowSchema),
  techStack: techStackSchema,
  developmentPhases: z.array(developmentPhaseSchema),
  potentialRisks: z.array(potentialRiskSchema),
  uiCode: z.string(),
  schema: z.string(),
  api: z.string(),
  preview: z.string(),
  files: z.array(projectFileSchema),
});

export type FullBlueprint = z.infer<typeof fullBlueprintSchema>;
