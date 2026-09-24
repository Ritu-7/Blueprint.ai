import { NextRequest } from 'next/server';
import { RagService } from '@/services/ragService';
import { ragChatSchema } from '@/validators/rag';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/rag/chat
 * Answers codebase queries using vector retrieval & non-hallucination prompt constraints.
 */
export async function POST(req: NextRequest) {
  try {
    const input = await validateRequestBody(ragChatSchema, req);
    const result = await RagService.chat(input);
    return apiSuccess(result);
  } catch (error: unknown) {
    return handleApiError(error, 'api/rag/chat');
  }
}
