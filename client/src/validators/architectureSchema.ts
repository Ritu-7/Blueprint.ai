import { z } from 'zod';

export const componentTypeEnum = z.enum([
  'FRONTEND',
  'BACKEND',
  'DATABASE',
  'AUTHENTICATION',
  'STORAGE',
  'AI_SERVICES',
  'EXTERNAL_APIS',
  'CACHING',
  'QUEUES',
  'MONITORING',
  'DEPLOYMENT',
]);

export const architectureComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: componentTypeEnum,
  technology: z.string(),
  responsibility: z.string(),
  dependencies: z.array(z.string()).default([]),
  position: z.object({ x: z.number(), y: z.number() }).default({ x: 0, y: 0 }),
});

export const architectureConnectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  protocol: z.string().default('HTTP/REST'),
  description: z.string().default(''),
});

export const fullArchitectureSchema = z.object({
  id: z.string().optional(),
  project_id: z.string(),
  components: z.array(architectureComponentSchema),
  connections: z.array(architectureConnectionSchema),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ComponentType = z.infer<typeof componentTypeEnum>;
export type ArchitectureComponent = z.infer<typeof architectureComponentSchema>;
export type ArchitectureConnection = z.infer<typeof architectureConnectionSchema>;
export type FullArchitecture = z.infer<typeof fullArchitectureSchema>;
