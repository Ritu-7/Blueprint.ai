import { NextRequest } from 'next/server';
import { GithubService } from '@/services/githubService';
import { fetchDiffSchema } from '@/validators/github';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/github/diff?owner=&repo=&base=&head=
 * Returns the list of changed files between two branches or commit SHAs.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = fetchDiffSchema.safeParse({
      owner: searchParams.get('owner') ?? '',
      repo: searchParams.get('repo') ?? '',
      base: searchParams.get('base') ?? 'main',
      head: searchParams.get('head') ?? '',
    });
    if (!parsed.success) {
      return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { owner, repo, base, head } = parsed.data;
    const diff = await GithubService.getChangedFiles(owner, repo, base, head);
    return apiSuccess(diff);
  } catch (error: unknown) {
    return handleApiError(error, 'api/github/diff');
  }
}
