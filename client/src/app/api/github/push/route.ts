import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { repoName, isPrivate, commitMessage, branchName, files } = await req.json();

    const token = process.env.GITHUB_TOKEN;
    const username = process.env.GITHUB_USERNAME;

    if (!token || !username) {
      return NextResponse.json(
        { success: false, error: 'GitHub credentials not configured in environment (GITHUB_TOKEN / GITHUB_USERNAME)' },
        { status: 400 }
      );
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    // 1. Create Repository
    console.log(`[github] Creating repository: ${repoName}`);
    const createRepoRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: repoName,
        private: isPrivate,
        auto_init: false,
      }),
    });

    if (!createRepoRes.ok) {
      const errorBody = await createRepoRes.json();
      console.error('[github] repository creation status:', createRepoRes.status, errorBody);
      
      if (errorBody.errors?.some((e: { message?: string }) => e.message === 'name already exists on this account')) {
        console.log(`[github] Repository ${repoName} already exists, proceeding with push.`);
      } else {
        return NextResponse.json(
          { success: false, error: `Failed to create repository: ${errorBody.message || JSON.stringify(errorBody)}` },
          { status: createRepoRes.status }
        );
      }
    }

    const owner = username;
    const repo = repoName;

    // 2. Create Blobs
    console.log(`[github] Creating blobs for ${files.length} files`);
    const treeItems = [];
    for (const file of files || []) {
      const content = typeof file.content === 'string' ? file.content : JSON.stringify(file.content);
      
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: content,
          encoding: 'utf-8',
        }),
      });

      if (!blobRes.ok) {
        const errorBody = await blobRes.json();
        throw new Error(`Failed to create blob for ${file.path}: ${errorBody.message || JSON.stringify(errorBody)}`);
      }

      const { sha } = await blobRes.json();
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha,
      });
    }

    // 3. Create Tree
    console.log('[github] Creating tree');
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tree: treeItems,
      }),
    });

    if (!treeRes.ok) {
      const errorBody = await treeRes.json();
      throw new Error(`Failed to create tree: ${errorBody.message || JSON.stringify(errorBody)}`);
    }

    const { sha: treeSha } = await treeRes.json();

    // 4. Create Commit
    console.log('[github] Creating commit');
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage || 'Initial blueprint commit',
        tree: treeSha,
      }),
    });

    if (!commitRes.ok) {
      const errorBody = await commitRes.json();
      throw new Error(`Failed to create commit: ${errorBody.message || JSON.stringify(errorBody)}`);
    }

    const { sha: commitSha } = await commitRes.json();

    // 5. Create or Update Ref
    const targetBranch = branchName || 'main';
    console.log(`[github] Updating ref: refs/heads/${targetBranch}`);
    
    const createRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${targetBranch}`,
        sha: commitSha,
      }),
    });

    if (!createRefRes.ok) {
      const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: commitSha,
          force: true,
        }),
      });

      if (!updateRefRes.ok) {
        const errorBody = await updateRefRes.json();
        throw new Error(`Failed to update ref: ${errorBody.message || JSON.stringify(errorBody)}`);
      }
    }

    return NextResponse.json({
      success: true,
      repoUrl: `https://github.com/${owner}/${repo}`,
      message: 'Successfully pushed to GitHub',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to push to GitHub';
    console.error('[github] push error', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
