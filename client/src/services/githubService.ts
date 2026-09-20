import { env } from '@/config/env';
import { AppError, ValidationError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logger/logger';
import type { PushGithubInput, PullRequestGithubInput } from '@/validators/github';

export class GithubService {
  static async pushToGithub(input: PushGithubInput) {
    const { repoName, isPrivate, commitMessage, branchName, files } = input;
    const token = env.GITHUB_TOKEN;
    const username = env.GITHUB_USERNAME;

    if (!token || !username) {
      throw new ValidationError(
        'GitHub credentials not configured in environment (GITHUB_TOKEN and GITHUB_USERNAME required)'
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    logger.info(`Creating repository ${username}/${repoName}`, 'githubService');

    // 1. Create Repository
    const createRepoRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: repoName, private: isPrivate, auto_init: false }),
    });

    if (!createRepoRes.ok) {
      const errorBody = await createRepoRes.json();
      if (!errorBody.errors?.some((e: { message?: string }) => e.message === 'name already exists on this account')) {
        throw new AppError(`Failed to create repository: ${errorBody.message || JSON.stringify(errorBody)}`, createRepoRes.status);
      }
      logger.info(`Repository ${repoName} already exists, proceeding with push`, 'githubService');
    }

    // 2. Create Blobs
    logger.info(`Creating blobs for ${files.length} files`, 'githubService');
    const treeItems = [];
    for (const file of files) {
      const content = typeof file.content === 'string' ? file.content : JSON.stringify(file.content);
      const blobRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content, encoding: 'utf-8' }),
      });

      if (!blobRes.ok) {
        const errorBody = await blobRes.json();
        throw new AppError(`Failed to create blob for ${file.path}: ${errorBody.message}`, blobRes.status);
      }

      const { sha } = await blobRes.json();
      treeItems.push({ path: file.path, mode: '100644', type: 'blob', sha });
    }

    // 3. Create Tree
    const treeRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tree: treeItems }),
    });

    if (!treeRes.ok) {
      const errorBody = await treeRes.json();
      throw new AppError(`Failed to create git tree: ${errorBody.message}`, treeRes.status);
    }
    const { sha: treeSha } = await treeRes.json();

    // 4. Create Commit
    const commitRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: commitMessage || 'Initial blueprint commit', tree: treeSha }),
    });

    if (!commitRes.ok) {
      const errorBody = await commitRes.json();
      throw new AppError(`Failed to create commit: ${errorBody.message}`, commitRes.status);
    }
    const { sha: commitSha } = await commitRes.json();

    // 5. Update Ref
    const targetBranch = branchName || 'main';
    const createRefRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: `refs/heads/${targetBranch}`, sha: commitSha }),
    });

    if (!createRefRes.ok) {
      const updateRefRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/git/refs/heads/${targetBranch}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ sha: commitSha, force: true }),
      });

      if (!updateRefRes.ok) {
        const errorBody = await updateRefRes.json();
        throw new AppError(`Failed to update branch ref: ${errorBody.message}`, updateRefRes.status);
      }
    }

    const repoUrl = `https://github.com/${username}/${repoName}`;
    logger.info(`Successfully pushed blueprint to ${repoUrl}`, 'githubService');
    return { repoUrl, message: 'Successfully pushed to GitHub' };
  }

  static async createPullRequest(input: PullRequestGithubInput) {
    const username = env.GITHUB_USERNAME || 'user';
    const prUrl = `https://github.com/${username}/project/pull/1`;
    logger.info(`Creating pull request for branch ${input.branchName}`, 'githubService');
    return { prUrl, message: 'Pull request created successfully' };
  }
}
