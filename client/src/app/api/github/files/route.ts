import { NextRequest } from 'next/server';
import { GithubService } from '@/services/githubService';
import { fetchFilesSchema } from '@/validators/github';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/github/files?owner=&repo=&branch=&path=
 * Returns the file tree at the given path in a repository.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = fetchFilesSchema.safeParse({
      owner: searchParams.get('owner') ?? '',
      repo: searchParams.get('repo') ?? '',
      branch: searchParams.get('branch') ?? 'main',
      path: searchParams.get('path') ?? '',
    });
    if (!parsed.success) {
      return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const files = await GithubService.getRepoFileTree(parsed.data);
    return apiSuccess(files);
  } catch (error: unknown) {
    return handleApiError(error, 'api/github/files');
  }
}
