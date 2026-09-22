import { NextRequest } from 'next/server';
import { GithubService } from '@/services/githubService';
import { connectRepoSchema } from '@/validators/github';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/github/connect
 * Validates that the token has access to the given repo and returns
 * safe repo metadata for storage in the project record.
 */
export async function POST(req: NextRequest) {
  try {
    const { owner, repo } = await validateRequestBody(connectRepoSchema, req);
    const details = await GithubService.getRepoDetails(owner, repo);
    return apiSuccess({ connected: true, repo: details });
  } catch (error: unknown) {
    return handleApiError(error, 'api/github/connect');
  }
}
