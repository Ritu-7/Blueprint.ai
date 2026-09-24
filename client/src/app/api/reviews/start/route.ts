import { NextRequest } from 'next/server';
import { CodeReviewService } from '@/services/codeReviewService';
import { startReviewSchema } from '@/validators/codeReview';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const input = await validateRequestBody(startReviewSchema, req);
    const jobId = CodeReviewService.startReview(input);
    return apiSuccess({ jobId, status: 'running', message: 'Code review started. Poll /api/reviews/status?jobId= for progress.' }, 202);
  } catch (error: unknown) {
    return handleApiError(error, 'api/reviews/start');
  }
}
