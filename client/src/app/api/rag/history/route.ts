import { NextRequest } from 'next/server';
import { RagService } from '@/services/ragService';
import { apiSuccess, apiError } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/rag/history?conversationId= OR ?projectId=
 * Returns conversation history or list of conversations.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const projectId = searchParams.get('projectId');

    if (conversationId) {
      const messages = RagService.getConversationHistory(conversationId);
      return apiSuccess(messages);
    }

    if (projectId) {
      const convs = RagService.listConversations(projectId);
      return apiSuccess(convs);
    }

    return apiError('Missing required parameter: conversationId or projectId', 400);
  } catch (error: unknown) {
    return handleApiError(error, 'api/rag/history');
  }
}
