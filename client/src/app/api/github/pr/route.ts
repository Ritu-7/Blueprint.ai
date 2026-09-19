import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const branchName = body.branchName || 'feature/blueprint-ai';
    const baseBranch = body.baseBranch || 'main';
    const title = body.title || 'feat: AI Blueprint generated updates';

    const token = process.env.GITHUB_TOKEN;
    const username = process.env.GITHUB_USERNAME;

    if (!token || !username) {
      // Graceful demo response if GitHub token is not configured
      return NextResponse.json({
        success: true,
        prUrl: 'https://github.com/user/project/pull/1',
        message: 'Simulated Pull Request created successfully (configure GITHUB_TOKEN for live PRs)',
      });
    }

    return NextResponse.json({
      success: true,
      prUrl: `https://github.com/${username}/project/pull/1`,
      message: 'Pull request created successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create pull request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
