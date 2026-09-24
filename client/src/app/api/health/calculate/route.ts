import { NextRequest } from 'next/server';
import { ProjectHealthService } from '@/services/projectHealthService';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/health/calculate
 * Calculates data-backed measurable health metrics and returns AI explanations referencing actual metrics.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = body.projectId || '00000000-0000-0000-0000-000000000000';

    const snapshot = ProjectHealthService.calculateHealthSnapshot(projectId, {
      requirements: body.requirements,
      tasks: body.tasks,
      apiEndpointsCount: body.apiEndpointsCount,
      testCasesCount: body.testCasesCount,
      openSecurityFindingsCount: body.openSecurityFindingsCount,
      openCodeReviewFindingsCount: body.openCodeReviewFindingsCount,
      hasRepo: body.hasRepo,
      buildStatus: body.buildStatus,
      hasSchema: body.hasSchema,
      hasApiDocs: body.hasApiDocs,
    });

    const analysis = await ProjectHealthService.generateRecommendations(snapshot);
    return apiSuccess(analysis);
  } catch (error: unknown) {
    return handleApiError(error, 'api/health/calculate');
  }
}
