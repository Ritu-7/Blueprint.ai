import { NextRequest } from 'next/server';
import { BlueprintService } from '@/services/blueprintService';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return apiSuccess([]);
    }

    const versions = await BlueprintService.fetchVersions(projectId);
    return apiSuccess(versions);
  } catch (err: unknown) {
    return handleApiError(err, 'api/blueprints/versions');
  }
}
