import { NextRequest } from 'next/server';
import { CodeReviewService } from '@/services/codeReviewService';
import { updateFindingStatusSchema } from '@/validators/codeReview';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess, apiError } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/reviews/finding-status
 * Updates a review finding status to OPEN, DISMISSED, or RESOLVED.
 */
export async function PATCH(req: NextRequest) {
  try {
    const input = await validateRequestBody(updateFindingStatusSchema, req);
    const updated = CodeReviewService.updateFindingStatus(input);
    if (!updated) {
      return apiError('Finding or review not found', 404);
    }
    return apiSuccess({ success: true, message: `Finding ${input.findingId} status set to ${input.status}` });
  } catch (error: unknown) {
    return handleApiError(error, 'api/reviews/finding-status');
  }
}
