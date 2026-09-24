import { NextRequest } from 'next/server';
import { QueueService } from '@/services/queueService';
import { apiSuccess, apiError } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs/status?jobId=<id>
 * Polls status, progress, retries, logs, and result of a background job.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return apiError('Missing required parameter: jobId', 400);
    }

    const job = QueueService.getJob(jobId);
    if (!job) {
      return apiError(`Background job not found: ${jobId}`, 404);
    }

    return apiSuccess(job);
  } catch (error: unknown) {
    return handleApiError(error, 'api/jobs/status');
  }
}

/**
 * POST /api/jobs/status
 * Lists all jobs optionally filtered by projectId or state.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = typeof body.projectId === 'string' ? body.projectId : undefined;
    const state = typeof body.state === 'string' ? body.state : undefined;

    const jobs = QueueService.listJobs(projectId, state as any);
    return apiSuccess(jobs);
  } catch (error: unknown) {
    return handleApiError(error, 'api/jobs/list');
  }
}
