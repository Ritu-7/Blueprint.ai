import { NextRequest } from 'next/server';
import { GithubService } from '@/services/githubService';
import { fetchBranchesSchema, createBranchSchema } from '@/validators/github';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/github/branches?owner=&repo=
 * Lists all branches in a repository.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = fetchBranchesSchema.safeParse({
      owner: searchParams.get('owner') ?? '',
      repo: searchParams.get('repo') ?? '',
    });
    if (!parsed.success) {
      return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const branches = await GithubService.getBranches(parsed.data.owner, parsed.data.repo);
    return apiSuccess(branches);
  } catch (error: unknown) {
    return handleApiError(error, 'api/github/branches GET');
  }
}

/**
 * POST /api/github/branches
 * Creates a new branch from a base branch.
 */
export async function POST(req: NextRequest) {
  try {
    const input = await validateRequestBody(createBranchSchema, req);
    const result = await GithubService.createBranch(input);
    return apiSuccess(result);
  } catch (error: unknown) {
    return handleApiError(error, 'api/github/branches POST');
  }
}
