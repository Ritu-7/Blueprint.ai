import { NextRequest } from 'next/server';
import { GithubService } from '@/services/githubService';
import { pullRequestGithubSchema } from '@/validators/github';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const input = await validateRequestBody(pullRequestGithubSchema, req);
    const result = await GithubService.createPullRequest(input);
    return apiSuccess(result);
  } catch (error: unknown) {
    return handleApiError(error, 'api/github/pr');
  }
}
