import { NextRequest } from 'next/server';
import { ProjectHealthService } from '@/services/projectHealthService';
import { apiSuccess, apiError } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/health/history?projectId=
 * Returns historical health snapshots for trend visualization.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return apiError('Missing required query parameter: projectId', 400);
    }

    const history = ProjectHealthService.getHistoricalSnapshots(projectId);
    return apiSuccess(history);
  } catch (error: unknown) {
    return handleApiError(error, 'api/health/history');
  }
}
