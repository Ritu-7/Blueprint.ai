import { NextRequest } from 'next/server';
import { TestGenerationService } from '@/services/testGenerationService';
import { generateTestsSchema } from '@/validators/testGeneration';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/testing/generate
 * Generates unit, API, or integration test suites covering happy paths, validation, auth, security, and edge cases.
 */
export async function POST(req: NextRequest) {
  try {
    const input = await validateRequestBody(generateTestsSchema, req);
    const suite = await TestGenerationService.generateTestSuite(input);
    return apiSuccess(suite);
  } catch (error: unknown) {
    return handleApiError(error, 'api/testing/generate');
  }
}
