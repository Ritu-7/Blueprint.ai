import { NextRequest } from 'next/server';
import { GithubService } from '@/services/githubService';
import { pushGithubSchema } from '@/validators/github';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/github/push
 * Pushes project files to a GitHub repository.
 * GitHub token is consumed entirely server-side.
 */
export async function POST(req: NextRequest) {
  try {
    const input = await validateRequestBody(pushGithubSchema, req);
    const result = await GithubService.pushToGithub(input);
    return apiSuccess(result);
  } catch (error: unknown) {
    return handleApiError(error, 'api/github/push');
  }
}
