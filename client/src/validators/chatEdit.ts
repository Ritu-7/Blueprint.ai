import { z } from 'zod';

export const chatEditSchema = z
  .object({
    currentFile: z
      .object({
        path: z.string().min(1, 'Current file path is required'),
        content: z.string().default(''),
      })
      .optional(),
    currentFilePath: z.string().optional(),
    currentFileContent: z.string().optional(),
    otherFilesSummary: z
      .union([z.string(), z.array(z.any()), z.record(z.any())])
      .optional()
      .default(''),
    instruction: z.string().trim().min(1, 'Instruction is required'),
    projectId: z.string().optional().nullable(),
  })
  .transform((data) => {
    const path = data.currentFile?.path || data.currentFilePath || 'app/page.tsx';
    const content = data.currentFile?.content ?? data.currentFileContent ?? '';
    return {
      currentFile: { path, content },
      otherFilesSummary: data.otherFilesSummary,
      instruction: data.instruction,
      projectId: data.projectId,
    };
  });

export type ChatEditInput = z.infer<typeof chatEditSchema>;
