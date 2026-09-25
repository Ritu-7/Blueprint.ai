import { NextRequest } from 'next/server';
import { AIService } from '@/services/aiService';
import { BlueprintService } from '@/services/blueprintService';
import { generatePromptSchema } from '@/validators/project';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';
import { requireAuth, requireProjectAccess } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { prompt } = await validateRequestBody(generatePromptSchema, request);
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (projectId) {
      await requireProjectAccess(projectId);
    }

    // Generate Zod-validated 12-section structured blueprint
    const structuredBlueprint = await AIService.generateProject(prompt);

    let versionInfo = null;
    if (projectId) {
      versionInfo = await BlueprintService.saveBlueprint(projectId, prompt, structuredBlueprint);
    }

    return apiSuccess({
      ...structuredBlueprint,
      project: {
        ...structuredBlueprint,
        prompt,
        ui_code: structuredBlueprint.uiCode,
        schema_code: structuredBlueprint.schema,
        api_code: structuredBlueprint.api,
      },
      version: versionInfo,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'api/generate');
  }
}
