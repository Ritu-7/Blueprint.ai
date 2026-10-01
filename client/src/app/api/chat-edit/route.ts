import { NextRequest } from 'next/server';
import { AIService } from '@/services/aiService';
import { chatEditSchema } from '@/validators/chatEdit';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { currentFile, otherFilesSummary, instruction } = await validateRequestBody(
      chatEditSchema,
      request
    );

    const result = await AIService.chatEdit({
      currentFile,
      otherFilesSummary,
      instruction,
    });

    return apiSuccess(result.modifiedFiles);
  } catch (error: unknown) {
    return handleApiError(error, 'api/chat-edit');
  }
}
