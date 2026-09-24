import { NextRequest } from 'next/server';
import { CodeReviewService } from '@/services/codeReviewService';
import { apiSuccess, apiError } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return apiError('Missing required query parameter: jobId', 400, 'MISSING_PARAM');
    }

    const job = CodeReviewService.getJob(jobId);
    if (!job) {
      return apiError(`Review job not found: ${jobId}`, 404, 'NOT_FOUND');
    }

    return apiSuccess(job);
  } catch (error: unknown) {
    return handleApiError(error, 'api/reviews/status');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = typeof body.projectId === 'string' ? body.projectId : undefined;
    const jobs = CodeReviewService.listJobs(projectId);
    const summary = jobs.map(({ result: _r, ...meta }) => meta);
    return apiSuccess(summary);
  } catch (error: unknown) {
    return handleApiError(error, 'api/reviews/list');
  }
}
