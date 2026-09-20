import { NextRequest } from 'next/server';
import { AIService } from '@/services/aiService';
import { generatePromptSchema } from '@/validators/project';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await validateRequestBody(generatePromptSchema, request);
    const generated = AIService.generateProject(prompt);

    return apiSuccess({
      ...generated,
      project: {
        ...generated,
        prompt,
        ui_code: generated.uiCode,
        schema_code: generated.schema,
        api_code: generated.api,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error, 'api/generate');
  }
}
