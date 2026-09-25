import { NextRequest } from 'next/server';
import { QueueService } from '@/services/queueService';
import { createJobSchema } from '@/validators/queue';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/jobs/create
 * Enqueues a non-blocking background job for expensive operations:
 * - REPOSITORY_ANALYSIS
 * - EMBEDDING_GENERATION
 * - BLUEPRINT_GENERATION
 * - CODE_REVIEW
 *
 * Returns HTTP 202 Accepted with jobId immediately.
 */
export async function POST(req: NextRequest) {
  try {
    const input = await validateRequestBody(createJobSchema, req);
    const job = await QueueService.enqueueJob(input);
    return apiSuccess({
      jobId: job.id,
      state: job.state,
      message: `Job ${job.id} enqueued successfully. Poll /api/jobs/status?jobId=${job.id} for progress.`,
    }, 202);
  } catch (error: unknown) {
    return handleApiError(error, 'api/jobs/create');
  }
}
