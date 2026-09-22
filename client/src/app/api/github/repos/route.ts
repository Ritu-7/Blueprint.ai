import { NextRequest } from 'next/server';
import { GithubService } from '@/services/githubService';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/github/repos
 * Lists repositories accessible to the configured GITHUB_TOKEN.
 * Token is consumed server-side — never returned to the browser.
 */
export async function GET(_req: NextRequest) {
  try {
    const repos = await GithubService.listUserRepositories();
    return apiSuccess(repos);
  } catch (error: unknown) {
    return handleApiError(error, 'api/github/repos');
  }
}
