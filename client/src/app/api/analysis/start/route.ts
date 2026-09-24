import { NextRequest } from 'next/server';
import { CodebaseAnalysisService } from '@/services/codebaseAnalysisService';
import { startAnalysisSchema } from '@/validators/codebaseAnalysis';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/analysis/start
 * Starts an async codebase intelligence analysis job.
 * Returns a jobId immediately — poll /api/analysis/status?jobId= for progress.
 *
 * Body: { owner, repo, branch?, projectId? }
 */
export async function POST(req: NextRequest) {
  try {
    const input = await validateRequestBody(startAnalysisSchema, req);
    const jobId = CodebaseAnalysisService.startAnalysis(input);
    return apiSuccess({ jobId, status: 'running', message: 'Analysis started. Poll /api/analysis/status?jobId= for progress.' }, 202);
  } catch (error: unknown) {
    return handleApiError(error, 'api/analysis/start');
  }
}
