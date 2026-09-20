import { NextRequest } from 'next/server';
import { ArchitectureService } from '@/services/architectureService';
import { fullArchitectureSchema } from '@/validators/architectureSchema';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) {
      return apiSuccess({ components: [], connections: [] });
    }

    const architecture = await ArchitectureService.fetchArchitecture(projectId);
    return apiSuccess(architecture);
  } catch (err: unknown) {
    return handleApiError(err, 'api/architecture:GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await validateRequestBody(fullArchitectureSchema, request);
    const saved = await ArchitectureService.saveArchitecture(input.project_id, input.components, input.connections);
    return apiSuccess(saved, 200);
  } catch (err: unknown) {
    return handleApiError(err, 'api/architecture:POST');
  }
}
