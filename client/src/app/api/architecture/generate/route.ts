import { NextRequest } from 'next/server';
import { ArchitectureService } from '@/services/architectureService';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';
import { ValidationError } from '@/lib/errors/AppError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) {
      throw new ValidationError('projectId parameter is required to generate architecture');
    }

    const generated = await ArchitectureService.generateArchitecture(projectId);
    return apiSuccess(generated, 201);
  } catch (err: unknown) {
    return handleApiError(err, 'api/architecture/generate:POST');
  }
}
