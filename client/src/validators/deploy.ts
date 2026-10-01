import { z } from 'zod';

export const vercelDeploySchema = z.object({
  projectName: z.string().default('blueprint-app'),
  files: z
    .array(
      z.object({
        path: z.string().min(1),
        content: z.string(),
      })
    )
    .min(1, 'Project must contain files to deploy'),
  vercelToken: z.string().optional().nullable(),
});

export type VercelDeployInput = z.infer<typeof vercelDeploySchema>;
