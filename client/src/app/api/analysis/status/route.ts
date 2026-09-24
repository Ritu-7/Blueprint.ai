import { NextRequest } from 'next/server';
import { CodebaseAnalysisService } from '@/services/codebaseAnalysisService';
import { apiSuccess, apiError } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/analysis/status?jobId=<id>
 * Returns the current state of an analysis job.
 * Poll this endpoint until status is "complete" or "failed".
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return apiError('Missing required query parameter: jobId', 400, 'MISSING_PARAM');
    }

    const job = CodebaseAnalysisService.getJob(jobId);
    if (!job) {
      return apiError(`Analysis job not found: ${jobId}`, 404, 'NOT_FOUND');
    }

    // Strip result from polling response if not complete (to keep payload small)
    const { result, ...jobMeta } = job;
    const payload =
      job.status === 'complete'
        ? { ...jobMeta, result }
        : jobMeta;

    return apiSuccess(payload);
  } catch (error: unknown) {
    return handleApiError(error, 'api/analysis/status');
  }
}

/**
 * GET /api/analysis/list?projectId=<optional>
 * Returns all analysis jobs (optionally filtered by projectId).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = typeof body.projectId === 'string' ? body.projectId : undefined;
    const jobs = CodebaseAnalysisService.listJobs(projectId);

    // Strip full results from list (too heavy)
    const summary = jobs.map(({ result: _r, ...meta }) => meta);
    return apiSuccess(summary);
  } catch (error: unknown) {
    return handleApiError(error, 'api/analysis/list');
  }
}
