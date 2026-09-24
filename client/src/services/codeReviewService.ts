import { env } from '@/config/env';
import { logger } from '@/lib/logger/logger';
import {
  SKIP_DIRS,
  SKIP_EXTENSIONS,
  HIGH_PRIORITY_FILES,
  MAX_FILE_BYTES,
} from '@/validators/codebaseAnalysis';
import {
  codeReviewResultSchema,
  type CodeReviewResult,
  type ReviewJob,
  type StartReviewInput,
} from '@/validators/codeReview';

const reviewJobStore: Record<string, ReviewJob> = {};

function createJobId(): string {
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const GITHUB_API = 'https://api.github.com';

function githubHeaders(): HeadersInit {
  const token = env.GITHUB_TOKEN;
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

interface TreeEntry {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha: string;
}

async function fetchFullTree(owner: string, repo: string, branch: string): Promise<TreeEntry[]> {
  const branchRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    { headers: githubHeaders(), cache: 'no-store' }
  );
  if (!branchRes.ok) throw new Error(`Failed to fetch branch ${branch}: ${branchRes.status}`);
  const branchData = await branchRes.json();
  const treeSha = branchData.object?.sha;
  if (!treeSha) throw new Error(`Could not resolve SHA for branch: ${branch}`);

  const treeRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    { headers: githubHeaders(), cache: 'no-store' }
  );
  if (!treeRes.ok) throw new Error(`Failed to fetch tree: ${treeRes.status}`);
  const { tree } = await treeRes.json();
  return tree as TreeEntry[];
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    { headers: githubHeaders(), cache: 'no-store' }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.encoding !== 'base64' || !data.content) return null;
  try {
    return Buffer.from((data.content as string).replace(/\n/g, ''), 'base64').toString('utf-8').slice(0, MAX_FILE_BYTES);
  } catch {
    return null;
  }
}

function shouldSkipEntry(entry: TreeEntry): boolean {
  if (entry.type !== 'blob') return true;
  const parts = entry.path.split('/');
  for (let i = 0; i < parts.length - 1; i++) {
    if (SKIP_DIRS.has(parts[i])) return true;
  }
  const filename = parts[parts.length - 1];
  const extParts = filename.split('.');
  const ext = extParts[extParts.length - 1]?.toLowerCase() ?? '';
  if (SKIP_EXTENSIONS.has(ext)) return true;
  return false;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

async function runReview(jobId: string, input: StartReviewInput): Promise<void> {
  const { owner, repo, branch } = input;
  const updateProgress = (progress: number, message: string) => {
    if (reviewJobStore[jobId]) {
      reviewJobStore[jobId] = { ...reviewJobStore[jobId], progress, progressMessage: message };
    }
    logger.info(`[Review ${jobId}] ${progress}% - ${message}`, 'codeReview');
  };

  try {
    updateProgress(10, 'Fetching file tree...');
    const tree = await fetchFullTree(owner, repo, branch);
    const eligible = tree.filter((e) => !shouldSkipEntry(e)).slice(0, 25);

    updateProgress(30, `Inspecting ${eligible.length} key source files...`);
    const files: Array<{ path: string; content: string }> = [];

    for (let i = 0; i < eligible.length; i++) {
      const content = await fetchFileContent(owner, repo, eligible[i].path);
      if (content) {
        files.push({ path: eligible[i].path, content });
      }
    }

    updateProgress(60, 'Synthesizing code quality & security findings via Gemini...');
    const codeContext = files.map((f) => `File: ${f.path}\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\``).join('\n\n');

    const prompt = `You are a Principal Software Architect and Security Auditor reviewing ${owner}/${repo} (${branch}).

Files Analyzed:
${codeContext}

Perform a comprehensive code review. Return ONLY valid JSON matching this schema:
{
  "summary": "2-3 sentence technical overview of repository quality, architecture, and safety",
  "overallScore": 85,
  "categories": {
    "codeQuality": 85,
    "security": 90,
    "performance": 80,
    "maintainability": 85,
    "testCoverage": 65
  },
  "findings": [
    {
      "id": "R001",
      "severity": "critical|high|medium|low|info",
      "category": "Security|Performance|Maintainability|Best Practice|Bug Risk|TypeScript|Documentation",
      "title": "Short title of issue",
      "description": "Clear explanation of what is wrong and why",
      "file": "path/to/file.ts",
      "lineHint": "approx line or function name",
      "suggestion": "How to fix this issue"
    }
  ],
  "positives": ["3-5 strengths of this codebase"],
  "recommendations": ["3-4 high-impact actionable next steps"]
}

Provide at least 4 realistic findings based on the provided files.`;

    const text = await callGemini(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to extract JSON from review output');

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = codeReviewResultSchema.parse(parsed);

    reviewJobStore[jobId] = {
      ...reviewJobStore[jobId],
      status: 'complete',
      progress: 100,
      progressMessage: 'Code review completed successfully.',
      result: validated,
      completedAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown review failure';
    logger.error(`Review ${jobId} failed: ${msg}`, 'codeReview');
    reviewJobStore[jobId] = {
      ...reviewJobStore[jobId],
      status: 'failed',
      progress: 100,
      progressMessage: `Review failed: ${msg}`,
      error: msg,
      completedAt: new Date().toISOString(),
    };
  }
}

export class CodeReviewService {
  static startReview(input: StartReviewInput): string {
    const jobId = createJobId();
    reviewJobStore[jobId] = {
      jobId,
      projectId: input.projectId,
      owner: input.owner,
      repo: input.repo,
      branch: input.branch,
      status: 'running',
      progress: 0,
      progressMessage: 'Starting code review...',
      startedAt: new Date().toISOString(),
    };

    setImmediate(() => runReview(jobId, input));
    return jobId;
  }

  static getJob(jobId: string): ReviewJob | null {
    return reviewJobStore[jobId] ?? null;
  }

  static listJobs(projectId?: string): ReviewJob[] {
    const all = Object.values(reviewJobStore).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    if (projectId) return all.filter((j) => j.projectId === projectId);
    return all;
  }
}
