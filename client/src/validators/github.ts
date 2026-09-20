import { z } from 'zod';
import { projectFileSchema } from './project';

export const pushGithubSchema = z.object({
  repoName: z.string().trim().min(1, 'Repository name is required').regex(/^[\w.-]+$/, 'Invalid repository name'),
  isPrivate: z.boolean().default(true),
  commitMessage: z.string().default('feat: initial blueprint generate'),
  branchName: z.string().default('main'),
  files: z.array(projectFileSchema).default([]),
});

export const pullRequestGithubSchema = z.object({
  branchName: z.string().default('feature/blueprint-ai'),
  baseBranch: z.string().default('main'),
  title: z.string().default('feat: AI Blueprint generated updates'),
});

export type PushGithubInput = z.infer<typeof pushGithubSchema>;
export type PullRequestGithubInput = z.infer<typeof pullRequestGithubSchema>;
