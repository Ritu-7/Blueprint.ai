import { NextRequest } from 'next/server';
import { GithubService } from '@/services/githubService';
import { fetchCommitsSchema } from '@/validators/github';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/github/commits?owner=&repo=&branch=&per_page=
 * Returns recent commits for a branch.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = fetchCommitsSchema.safeParse({
      owner: searchParams.get('owner') ?? '',
      repo: searchParams.get('repo') ?? '',
      branch: searchParams.get('branch') ?? 'main',
      per_page: searchParams.get('per_page') ?? '30',
    });
    if (!parsed.success) {
      return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const commits = await GithubService.getCommits(parsed.data);
    return apiSuccess(commits);
  } catch (error: unknown) {
    return handleApiError(error, 'api/github/commits');
  }
}
