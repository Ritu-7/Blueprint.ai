import { NextRequest } from 'next/server';
import { RagService } from '@/services/ragService';
import { indexRepoSchema } from '@/validators/rag';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/rag/index
 * Indexes a GitHub repository into code chunks with embeddings.
 */
export async function POST(req: NextRequest) {
  try {
    const input = await validateRequestBody(indexRepoSchema, req);
    const result = await RagService.indexRepository(input);
    return apiSuccess({
      message: `Successfully indexed repository ${input.owner}/${input.repo}`,
      ...result,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'api/rag/index');
  }
}
