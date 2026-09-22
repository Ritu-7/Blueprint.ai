import { env } from '@/config/env';
import { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logger/logger';
import type {
  PushGithubInput,
  PullRequestGithubInput,
  CreateBranchInput,
  FetchCommitsInput,
  FetchFilesInput,
  FetchDiffInput,
  GithubRepo,
  GithubBranch,
  GithubCommit,
  GithubFileEntry,
  GithubDiffFile,
  GithubPullRequest,
} from '@/validators/github';

const GITHUB_API = 'https://api.github.com';

/**
 * Internal helper — builds standard headers with server-side token.
 * Token is NEVER sent to the browser; this runs server-side only.
 */
function buildHeaders(): HeadersInit {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    throw new ValidationError(
      'GitHub integration not configured. Set GITHUB_TOKEN in environment variables.'
    );
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Internal helper — maps GitHub API HTTP errors to typed AppErrors.
 */
async function mapGithubError(res: Response, context: string): Promise<never> {
  let body: { message?: string; errors?: { message?: string }[] } = {};
  try {
    body = await res.json();
  } catch {
    // ignore parse failure
  }

  const msg = body.message || `GitHub API error (${res.status})`;

  // Rate limit
  const remaining = res.headers.get('x-ratelimit-remaining');
  const resetAt = res.headers.get('x-ratelimit-reset');
  if (res.status === 403 && remaining === '0') {
    const resetTime = resetAt ? new Date(parseInt(resetAt, 10) * 1000).toISOString() : 'unknown';
    throw new AppError(
      `GitHub API rate limit exceeded. Resets at ${resetTime}.`,
      429,
      'RATE_LIMITED'
    );
  }

  if (res.status === 401) throw new UnauthorizedError(`GitHub authentication failed: ${msg}`);
  if (res.status === 403) throw new ForbiddenError(`GitHub access forbidden: ${msg}`);
  if (res.status === 404) throw new NotFoundError(`GitHub resource not found in ${context}: ${msg}`);
  if (res.status === 422) {
    const detail = body.errors?.map((e) => e.message).join(', ') || msg;
    throw new ValidationError(`GitHub validation error in ${context}: ${detail}`);
  }

  throw new AppError(`${context}: ${msg}`, res.status);
}

// ─────────────────────────────────────────────────────────────────────────────
// GithubService
// ─────────────────────────────────────────────────────────────────────────────

export class GithubService {
  /**
   * Returns the authenticated user's GitHub username.
   */
  static async getAuthenticatedUser(): Promise<{ login: string; avatar_url: string; html_url: string }> {
    const headers = buildHeaders();
    const res = await fetch(`${GITHUB_API}/user`, { headers, cache: 'no-store' });
    if (!res.ok) await mapGithubError(res, 'getAuthenticatedUser');
    const data = await res.json();
    return { login: data.login, avatar_url: data.avatar_url, html_url: data.html_url };
  }

  /**
   * Lists repositories accessible to the authenticated token.
   * Returns safe metadata — never the token itself.
   */
  static async listUserRepositories(per_page = 50): Promise<GithubRepo[]> {
    const headers = buildHeaders();
    const res = await fetch(
      `${GITHUB_API}/user/repos?sort=updated&per_page=${per_page}&type=all`,
      { headers, cache: 'no-store' }
    );
    if (!res.ok) await mapGithubError(res, 'listUserRepositories');
    const data = await res.json();

    return (data as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      owner: r.owner.login,
      private: r.private,
      description: r.description,
      html_url: r.html_url,
      default_branch: r.default_branch,
      language: r.language,
      stargazers_count: r.stargazers_count,
      updated_at: r.updated_at,
    }));
  }

  /**
   * Fetches public metadata for a specific repository.
   * Validates that the token has access before returning.
   */
  static async getRepoDetails(owner: string, repo: string): Promise<GithubRepo> {
    const headers = buildHeaders();
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) await mapGithubError(res, `getRepoDetails(${owner}/${repo})`);
    const r = await res.json();
    return {
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      owner: r.owner.login,
      private: r.private,
      description: r.description,
      html_url: r.html_url,
      default_branch: r.default_branch,
      language: r.language,
      stargazers_count: r.stargazers_count,
      updated_at: r.updated_at,
    };
  }

  /**
   * Lists all branches in a repository.
   */
  static async getBranches(owner: string, repo: string): Promise<GithubBranch[]> {
    const headers = buildHeaders();
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/branches?per_page=100`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) await mapGithubError(res, `getBranches(${owner}/${repo})`);
    const data = await res.json();
    return (data as any[]).map((b) => ({
      name: b.name,
      sha: b.commit.sha,
      protected: b.protected,
    }));
  }

  /**
   * Creates a new branch from a given base branch.
   */
  static async createBranch(input: CreateBranchInput): Promise<{ ref: string; sha: string }> {
    const { owner, repo, branchName, fromBranch } = input;
    const headers = buildHeaders();

    // Get the SHA of the base branch
    const baseRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`,
      { headers, cache: 'no-store' }
    );
    if (!baseRes.ok) await mapGithubError(baseRes, `createBranch - resolve base(${fromBranch})`);
    const { object: { sha: baseSha } } = await baseRes.json();

    // Create the new branch ref
    const createRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
    });
    if (!createRes.ok) await mapGithubError(createRes, `createBranch(${branchName})`);
    const { ref, object: { sha } } = await createRes.json();

    logger.info(`Created branch ${branchName} from ${fromBranch} (${sha})`, 'githubService');
    return { ref, sha };
  }

  /**
   * Returns recent commits for a branch.
   */
  static async getCommits(input: FetchCommitsInput): Promise<GithubCommit[]> {
    const { owner, repo, branch, per_page } = input;
    const headers = buildHeaders();
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${per_page}`,
      { headers, cache: 'no-store' }
    );
    if (!res.ok) await mapGithubError(res, `getCommits(${owner}/${repo}@${branch})`);
    const data = await res.json();
    return (data as any[]).map((c) => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0], // first line only
      author: c.commit.author?.name || c.author?.login || 'Unknown',
      authorAvatar: c.author?.avatar_url || '',
      date: c.commit.author?.date || '',
      url: c.html_url,
    }));
  }

  /**
   * Returns the file tree at a given path in a repository.
   */
  static async getRepoFileTree(input: FetchFilesInput): Promise<GithubFileEntry[]> {
    const { owner, repo, branch, path } = input;
    const headers = buildHeaders();
    const encodedPath = path ? encodeURIComponent(path) : '';
    const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`;
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) await mapGithubError(res, `getRepoFileTree(${owner}/${repo}/${path})`);
    const data = await res.json();

    const items = Array.isArray(data) ? data : [data];
    return items.map((item: any) => ({
      name: item.name,
      path: item.path,
      type: item.type as 'file' | 'dir',
      sha: item.sha,
      size: item.size ?? 0,
      url: item.html_url,
    }));
  }

  /**
   * Returns files changed between two branches or commit SHAs.
   */
  static async getChangedFiles(owner: string, repo: string, base: string, head: string): Promise<GithubDiffFile[]> {
    const headers = buildHeaders();
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/compare/${base}...${head}`,
      { headers, cache: 'no-store' }
    );
    if (!res.ok) await mapGithubError(res, `getChangedFiles(${base}...${head})`);
    const data = await res.json();
    return ((data.files ?? []) as any[]).map((f: any) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
      patch: f.patch,
    }));
  }

  /**
   * Pushes project files to a GitHub repository.
   * Creates the repo if it doesn't exist. Never exposes the token.
   */
  static async pushToGithub(input: PushGithubInput): Promise<{ repoUrl: string; message: string }> {
    const { repoName, isPrivate, commitMessage, branchName, files } = input;
    const headers = buildHeaders();

    // Determine the owner — prefer explicit, fallback to env username, then authenticated user
    let owner = input.owner || env.GITHUB_USERNAME;
    if (!owner) {
      const user = await GithubService.getAuthenticatedUser();
      owner = user.login;
    }

    logger.info(`Pushing ${files.length} file(s) to ${owner}/${repoName}`, 'githubService');

    // 1. Create Repository (no-op if already exists)
    const createRepoRes = await fetch(`${GITHUB_API}/user/repos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: repoName, private: isPrivate, auto_init: false }),
    });
    if (!createRepoRes.ok) {
      const body = await createRepoRes.json();
      const alreadyExists = body.errors?.some(
        (e: { message?: string }) => e.message === 'name already exists on this account'
      );
      if (!alreadyExists) await mapGithubError(createRepoRes, `pushToGithub - createRepo(${repoName})`);
      logger.info(`Repository ${repoName} already exists`, 'githubService');
    }

    // 2. Create Blobs
    const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];
    for (const file of files) {
      const content = typeof file.content === 'string' ? file.content : JSON.stringify(file.content);
      const blobRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content, encoding: 'utf-8' }),
      });
      if (!blobRes.ok) await mapGithubError(blobRes, `pushToGithub - createBlob(${file.path})`);
      const { sha } = await blobRes.json();
      treeItems.push({ path: file.path, mode: '100644', type: 'blob', sha });
    }

    // 3. Create Tree
    const treeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tree: treeItems }),
    });
    if (!treeRes.ok) await mapGithubError(treeRes, 'pushToGithub - createTree');
    const { sha: treeSha } = await treeRes.json();

    // 4. Create Commit (rootless — intentional for initial push)
    const commitRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage || 'feat: blueprint initial commit',
        tree: treeSha,
      }),
    });
    if (!commitRes.ok) await mapGithubError(commitRes, 'pushToGithub - createCommit');
    const { sha: commitSha } = await commitRes.json();

    // 5. Update Ref (create or force-update)
    const targetBranch = branchName || 'main';
    const createRefRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: `refs/heads/${targetBranch}`, sha: commitSha }),
    });

    if (!createRefRes.ok) {
      // Ref may already exist — try a force patch
      const patchRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repoName}/git/refs/heads/${targetBranch}`,
        { method: 'PATCH', headers, body: JSON.stringify({ sha: commitSha, force: true }) }
      );
      if (!patchRes.ok) await mapGithubError(patchRes, 'pushToGithub - updateRef');
    }

    const repoUrl = `https://github.com/${owner}/${repoName}`;
    logger.info(`Successfully pushed to ${repoUrl}`, 'githubService');
    return { repoUrl, message: 'Successfully pushed to GitHub' };
  }

  /**
   * Creates a real Pull Request via the GitHub REST API.
   */
  static async createPullRequest(input: PullRequestGithubInput): Promise<{ prUrl: string; number: number }> {
    const { owner, repo, branchName, baseBranch, title, body } = input;
    const headers = buildHeaders();

    logger.info(`Creating PR: ${branchName} → ${baseBranch} in ${owner}/${repo}`, 'githubService');

    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        body,
        head: branchName,
        base: baseBranch,
      }),
    });
    if (!res.ok) await mapGithubError(res, `createPullRequest(${owner}/${repo})`);
    const data = await res.json();

    logger.info(`Pull request #${data.number} created: ${data.html_url}`, 'githubService');
    return { prUrl: data.html_url, number: data.number };
  }

  /**
   * Lists open pull requests in a repository.
   */
  static async listPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GithubPullRequest[]> {
    const headers = buildHeaders();
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=${state}&per_page=50`,
      { headers, cache: 'no-store' }
    );
    if (!res.ok) await mapGithubError(res, `listPullRequests(${owner}/${repo})`);
    const data = await res.json();
    return (data as any[]).map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      html_url: pr.html_url,
      state: pr.merged_at ? 'merged' : pr.state,
      head: pr.head.ref,
      base: pr.base.ref,
      created_at: pr.created_at,
    }));
  }
}
