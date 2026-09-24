import { z } from 'zod';

export const indexRepoSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  owner: z.string().trim().min(1, 'Owner is required'),
  repo: z.string().trim().min(1, 'Repository is required'),
  branch: z.string().default('main'),
});

export const ragChatSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  message: z.string().trim().min(1, 'Message is required'),
  conversationId: z.string().uuid().optional(),
  owner: z.string().trim().optional(),
  repo: z.string().trim().optional(),
});

export const sourceReferenceSchema = z.object({
  filePath: z.string(),
  startLine: z.number(),
  endLine: z.number(),
  snippet: z.string(),
  score: z.number(),
});

export const ragResponseSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  answer: z.string(),
  sources: z.array(sourceReferenceSchema),
  retrievedCount: z.number(),
  tokensUsed: z.number().optional(),
});

export type IndexRepoInput = z.infer<typeof indexRepoSchema>;
export type RagChatInput = z.infer<typeof ragChatSchema>;
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type RagResponse = z.infer<typeof ragResponseSchema>;

export interface CodeChunkMetadata {
  filePath: string;
  fileName: string;
  language: string;
  startLine: number;
  endLine: number;
  sha?: string;
}

export interface StoredCodeChunk {
  id: string;
  projectId: string;
  repoName: string;
  filePath: string;
  chunkIndex: number;
  content: string;
  metadata: CodeChunkMetadata;
  embedding: number[];
}
