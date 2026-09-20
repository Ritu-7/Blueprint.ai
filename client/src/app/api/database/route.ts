import { NextRequest } from 'next/server';
import { DatabaseDesignService } from '@/services/databaseDesignService';
import { fullDatabaseDesignSchema } from '@/validators/databaseSchema';
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
      return apiSuccess({ tables: [] });
    }

    const design = await DatabaseDesignService.fetchDatabaseDesign(projectId);
    return apiSuccess(design);
  } catch (err: unknown) {
    return handleApiError(err, 'api/database:GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await validateRequestBody(fullDatabaseDesignSchema, request);
    const saved = await DatabaseDesignService.saveDatabaseDesign(input.project_id, input.tables);
    return apiSuccess(saved, 200);
  } catch (err: unknown) {
    return handleApiError(err, 'api/database:POST');
  }
}
