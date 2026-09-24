import { env } from '@/config/env';
import { logger } from '@/lib/logger/logger';
import {
  SKIP_DIRS,
  SKIP_EXTENSIONS,
  MAX_FILE_BYTES,
} from '@/validators/codebaseAnalysis';
import {
  codeReviewResultSchema,
  type CodeReviewResult,
  type ReviewJob,
  type StartReviewInput,
  type FindingStatus,
  type UpdateFindingStatusInput,
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

async function fetchPRFiles(owner: string, repo: string, prNumber: number): Promise<Array<{ filename: string; patch?: string; contentsUrl?: string }>> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
    headers: githubHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch PR #${prNumber} files: ${res.status}`);
  const files = await res.json();
  return files.map((f: any) => ({ filename: f.filename, patch: f.patch, contentsUrl: f.contents_url }));
}

async function fetchCommitFiles(owner: string, repo: string, sha: string): Promise<Array<{ filename: string; patch?: string }>> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`, {
    headers: githubHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch commit ${sha}: ${res.status}`);
  const data = await res.json();
  return (data.files || []).map((f: any) => ({ filename: f.filename, patch: f.patch }));
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    headers: githubHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.encoding !== 'base64' || !data.content) return null;
  try {
    return Buffer.from((data.content as string).replace(/\n/g, ''), 'base64').toString('utf-8').slice(0, MAX_FILE_BYTES);
  } catch {
    return null;
  }
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
  const { owner, repo, branch, targetType, prNumber, commitSha, filePaths } = input;

  const updateProgress = (progress: number, message: string) => {
    if (reviewJobStore[jobId]) {
      reviewJobStore[jobId] = { ...reviewJobStore[jobId], progress, progressMessage: message };
    }
    logger.info(`[Review ${jobId}] ${progress}% - ${message}`, 'codeReview');
  };

  try {
    let diffContext = '';

    if (targetType === 'pull_request' && prNumber) {
      updateProgress(15, `Fetching Pull Request #${prNumber} diff...`);
      const prFiles = await fetchPRFiles(owner, repo, prNumber);
      diffContext = prFiles
        .map((f) => `File: ${f.filename}\nPatch:\n${f.patch || 'No patch hunk'}`)
        .join('\n\n');
    } else if (targetType === 'commit' && commitSha) {
      updateProgress(15, `Fetching commit ${commitSha.slice(0, 7)} diff...`);
      const commitFiles = await fetchCommitFiles(owner, repo, commitSha);
      diffContext = commitFiles
        .map((f) => `File: ${f.filename}\nPatch:\n${f.patch || 'No patch'}`)
        .join('\n\n');
    } else if (targetType === 'selected_files' && filePaths && filePaths.length > 0) {
      updateProgress(15, `Fetching ${filePaths.length} selected file(s)...`);
      const contents = await Promise.all(
        filePaths.slice(0, 15).map(async (p) => {
          const c = await fetchFileContent(owner, repo, p);
          return c ? `File: ${p}\nContent:\n${c.slice(0, 3000)}` : null;
        })
      );
      diffContext = contents.filter(Boolean).join('\n\n');
    } else {
      updateProgress(15, 'Fetching repository key files for full audit...');
      const treeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
        headers: githubHeaders(),
        cache: 'no-store',
      });
      if (treeRes.ok) {
        const { tree } = await treeRes.json();
        const eligible = (tree as Array<{ path: string; type: string }>).filter(
          (e) => e.type === 'blob' && !SKIP_DIRS.has(e.path.split('/')[0])
        ).slice(0, 20);

        const contents = await Promise.all(
          eligible.map(async (f) => {
            const c = await fetchFileContent(owner, repo, f.path);
            return c ? `File: ${f.path}\n\`\`\`\n${c.slice(0, 2500)}\n\`\`\`` : null;
          })
        );
        diffContext = contents.filter(Boolean).join('\n\n');
      }
    }

    updateProgress(50, 'Analyzing code patterns across 7 quality & security dimensions...');

    const prompt = `You are a Principal Security Architect and Senior Code Reviewer analyzing code changes in ${owner}/${repo}.

Code Context under Review:
${diffContext.slice(0, 25000)}

Perform a strict non-destructive AI Code Review. Return ONLY valid JSON matching this schema:
{
  "prSummary": "Comprehensive 3-5 sentence summary of the pull request / code changes",
  "riskAssessment": "LOW|MEDIUM|HIGH|CRITICAL",
  "overallScore": 85,
  "categories": {
    "security": 90,
    "bugs": 85,
    "performance": 80,
    "architecture": 85,
    "maintainability": 80,
    "codeQuality": 88,
    "testing": 70
  },
  "findings": [
    {
      "id": "find-1",
      "severity": "critical|high|medium|low|info",
      "category": "Security|Bug|Performance|Architecture|Maintainability|Code Quality|Testing",
      "file": "path/to/file.ts",
      "line": 42,
      "title": "Clear concise finding title",
      "description": "Detailed technical explanation of the vulnerability, bug, or design issue",
      "recommendation": "Actionable non-destructive suggestion or code fix pattern",
      "status": "OPEN"
    }
  ],
  "testRecommendations": [
    "Specific unit/integration test cases that should be added to verify these changes"
  ],
  "positiveNotes": [
    "Clean code practices and good design choices identified in these changes"
  ]
}

Rules:
- Category MUST be EXACTLY one of: Security, Bug, Performance, Architecture, Maintainability, Code Quality, Testing
- Provide at least 5 realistic, high-value findings
- Do NOT output markdown code fences around JSON`;

    const text = await callGemini(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse review JSON output');

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = codeReviewResultSchema.parse(parsed);

    reviewJobStore[jobId] = {
      ...reviewJobStore[jobId],
      status: 'complete',
      progress: 100,
      progressMessage: 'Code review complete.',
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
      targetType: input.targetType,
      prNumber: input.prNumber,
      commitSha: input.commitSha,
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

  static updateFindingStatus(input: UpdateFindingStatusInput): boolean {
    const { reviewId, findingId, status } = input;
    const job = reviewJobStore[reviewId];
    if (!job || !job.result) return false;

    const finding = job.result.findings.find((f) => f.id === findingId);
    if (finding) {
      finding.status = status as FindingStatus;
      return true;
    }
    return false;
  }
}
