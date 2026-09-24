import { env } from '@/config/env';
import { logger } from '@/lib/logger/logger';
import {
  SKIP_DIRS,
  SKIP_EXTENSIONS,
  HIGH_PRIORITY_FILES,
  MAX_FILE_BYTES,
  CHARS_PER_TOKEN,
  MAX_CHUNK_TOKENS,
  codebaseAnalysisResultSchema,
  type CodebaseAnalysisResult,
  type AnalysisJob,
  type StartAnalysisInput,
  AnalysisStatus,
} from '@/validators/codebaseAnalysis';

// ── In-memory job store ────────────────────────────────────────────────────
// For multi-instance deployments, swap this for a Redis/Supabase-backed store.
const jobStore: Record<string, AnalysisJob> = {};

function createJobId(): string {
  return `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── GitHub fetch helpers ────────────────────────────────────────────────────

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

/** Fetches the full recursive git tree for a branch. */
async function fetchFullTree(owner: string, repo: string, branch: string): Promise<TreeEntry[]> {
  // Get branch SHA
  const branchRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    { headers: githubHeaders(), cache: 'no-store' }
  );
  if (!branchRes.ok) throw new Error(`Failed to fetch branch ${branch}: ${branchRes.status}`);
  const branchData = await branchRes.json();
  const treeSha = branchData.object?.sha;

  if (!treeSha) throw new Error(`Could not resolve SHA for branch: ${branch}`);

  // Fetch recursive tree
  const treeRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    { headers: githubHeaders(), cache: 'no-store' }
  );
  if (!treeRes.ok) throw new Error(`Failed to fetch tree: ${treeRes.status}`);
  const { tree, truncated } = await treeRes.json();
  if (truncated) {
    logger.warn(`Tree truncated for ${owner}/${repo}`, 'codebaseAnalysis');
  }
  return (tree as TreeEntry[]);
}

/** Fetches file content, returns null if too large or on error. */
async function fetchFileContent(owner: string, repo: string, path: string, sizeBound: number): Promise<string | null> {
  if (sizeBound > MAX_FILE_BYTES) return null;

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    { headers: githubHeaders(), cache: 'no-store' }
  );
  if (!res.ok) return null;

  const data = await res.json();
  if (data.encoding !== 'base64' || !data.content) return null;

  try {
    const decoded = Buffer.from((data.content as string).replace(/\n/g, ''), 'base64').toString('utf-8');
    return decoded.slice(0, MAX_FILE_BYTES);
  } catch {
    return null;
  }
}

// ── File filtering ─────────────────────────────────────────────────────────

function shouldSkipEntry(entry: TreeEntry): boolean {
  if (entry.type !== 'blob') return true;
  const parts = entry.path.split('/');

  // Skip any path through a blocked directory
  for (let i = 0; i < parts.length - 1; i++) {
    if (SKIP_DIRS.has(parts[i])) return true;
  }

  const filename = parts[parts.length - 1];

  // Skip dot-files except known config
  if (
    filename.startsWith('.') &&
    !['env.example', 'env.sample', 'prettierrc', 'eslintrc', 'gitignore'].some((n) =>
      filename.includes(n)
    )
  ) {
    return true;
  }

  // Skip by extension
  const extParts = filename.split('.');
  const ext = extParts[extParts.length - 1]?.toLowerCase() ?? '';
  if (SKIP_EXTENSIONS.has(ext)) return true;

  // Skip minified files
  if (filename.endsWith('.min.js') || filename.endsWith('.min.css')) return true;

  // Skip generated .d.ts in output dirs
  if (
    filename.endsWith('.d.ts') &&
    (entry.path.includes('/dist/') || entry.path.includes('/build/'))
  ) {
    return true;
  }

  return false;
}

function isHighPriority(path: string): boolean {
  const parts = path.split('/');
  const filename = parts[parts.length - 1] ?? '';
  return HIGH_PRIORITY_FILES.has(filename) || HIGH_PRIORITY_FILES.has(path);
}

// ── Token budgeting ────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function buildChunks(
  files: Array<{ path: string; content: string }>,
  maxTokensPerChunk: number
): string[][] {
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (const file of files) {
    const block = `### File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``;
    const tokens = estimateTokens(block);

    if (tokens > maxTokensPerChunk) {
      const maxChars = maxTokensPerChunk * CHARS_PER_TOKEN;
      const truncated = `### File: ${file.path} (truncated)\n\`\`\`\n${file.content.slice(0, maxChars)}...\n\`\`\``;
      currentChunk.push(truncated);
      currentTokens += estimateTokens(truncated);
    } else if (currentTokens + tokens > maxTokensPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk.slice());
      currentChunk = [block];
      currentTokens = tokens;
    } else {
      currentChunk.push(block);
      currentTokens += tokens;
    }
  }

  if (currentChunk.length > 0) chunks.push(currentChunk);
  return chunks;
}

// ── Gemini REST API call ───────────────────────────────────────────────────

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
        temperature: 0.1,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

// ── LLM Analysis ──────────────────────────────────────────────────────────

async function runLLMAnalysis(
  owner: string,
  repo: string,
  branch: string,
  fileChunks: string[][],
  fileIndex: Array<{ path: string; size: number; priority: 'high' | 'normal' }>
): Promise<CodebaseAnalysisResult> {
  const indexSummary = fileIndex
    .map(
      (f) =>
        `${f.priority === 'high' ? '⭐' : '-'} ${f.path} (${(f.size / 1024).toFixed(1)}KB)`
    )
    .join('\n');

  const codeBlocks = fileChunks.flat().join('\n\n');

  const prompt = `You are a senior software architect analyzing the GitHub repository ${owner}/${repo} (branch: ${branch}).

## Repository File Index (${fileIndex.length} files selected)
${indexSummary}

## Code Content
${codeBlocks}

## Task
Perform comprehensive codebase analysis. Return ONLY a valid JSON object matching this structure (no markdown):

{
  "repoFullName": "${owner}/${repo}",
  "branch": "${branch}",
  "analyzedAt": "${new Date().toISOString()}",
  "filesAnalyzed": ${fileIndex.length},
  "totalFilesFound": ${fileIndex.length},
  "tokensUsed": 0,
  "architectureSummary": {
    "projectType": "string - e.g. Full-stack Next.js web application",
    "overview": "3-5 sentence technical description of the codebase",
    "layers": ["list of architecture layers e.g. Frontend (React)", "API Routes", "Database (Supabase)"],
    "patterns": ["design patterns detected e.g. Service Layer", "Repository Pattern"],
    "entryPoints": ["actual file paths that are entry points"]
  },
  "technologyMap": [
    { "name": "string", "category": "language|framework|library|database|tool|platform|testing|ci_cd", "version": "string (optional)", "confidence": "high|medium|low" }
  ],
  "importantFiles": [
    { "path": "string", "purpose": "string", "priority": "critical|high|medium|low" }
  ],
  "apiMap": [
    { "path": "string - e.g. /api/users", "method": "GET|POST|PUT|PATCH|DELETE|ANY", "description": "string", "file": "string", "authenticated": true }
  ],
  "dependencyMap": [
    { "from": "string - module/file", "to": "string - module/file", "type": "imports|extends|implements|uses|depends_on" }
  ],
  "securityFindings": [
    { "severity": "critical|high|medium|low|info", "title": "string", "description": "string", "file": "string (optional)", "recommendation": "string" }
  ],
  "technicalDebt": [
    { "severity": "high|medium|low", "category": "complexity|duplication|outdated|missing_types|poor_error_handling|other", "description": "string", "file": "string (optional)", "impact": "string" }
  ],
  "testingGaps": [
    { "severity": "high|medium|low", "description": "string", "file": "string (optional)", "suggestion": "string" }
  ],
  "documentationGaps": [
    { "severity": "high|medium|low", "description": "string", "file": "string (optional)", "suggestion": "string" }
  ]
}

Rules:
- Return ONLY the JSON object, no explanation, no markdown fences
- Reference actual file names from the index above
- securityFindings: flag hardcoded secrets, missing auth guards, SQL injection risks, exposed env vars in client code
- technicalDebt: flag missing types, any, poor error handling, duplicated logic, god classes
- testingGaps: identify components/routes/services with no test files present in the index
- documentationGaps: identify files/modules with no JSDoc/comments, missing README sections
- apiMap: find ALL Next.js route.ts files, Express routes, FastAPI handlers in the code
- dependencyMap: top 15 most important inter-module relationships only
- Be specific and accurate based on the actual code provided`;

  const responseText = await callGemini(prompt);

  // Extract JSON (Gemini with responseMimeType=json should return pure JSON)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM returned no valid JSON object');

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  const validated = codebaseAnalysisResultSchema.parse({
    ...(parsed as object),
    tokensUsed: estimateTokens(prompt + responseText),
  });

  return validated;
}

// ── Main Analysis Runner ────────────────────────────────────────────────────

async function runAnalysis(jobId: string, input: StartAnalysisInput): Promise<void> {
  const { owner, repo, branch } = input;

  const updateProgress = (progress: number, message: string) => {
    const existing = jobStore[jobId];
    if (existing) {
      jobStore[jobId] = { ...existing, progress, progressMessage: message };
    }
    logger.info(`[${jobId}] ${progress}% - ${message}`, 'codebaseAnalysis');
  };

  try {
    // Step 1: Fetch file tree
    updateProgress(5, 'Fetching repository file tree...');
    const tree = await fetchFullTree(owner, repo, branch);
    const allBlobs = tree.filter((e) => e.type === 'blob');

    // Step 2: Filter files
    updateProgress(15, `Filtering ${allBlobs.length} files...`);
    const eligible = allBlobs.filter((e) => !shouldSkipEntry(e));

    // Sort: high-priority first, then by size ascending
    eligible.sort((a, b) => {
      const aHigh = isHighPriority(a.path) ? 0 : 1;
      const bHigh = isHighPriority(b.path) ? 0 : 1;
      if (aHigh !== bHigh) return aHigh - bHigh;
      return (a.size ?? 0) - (b.size ?? 0);
    });

    // Cap at 150 files
    const candidateFiles = eligible.slice(0, 150);

    // Step 3: Fetch content with token budgeting
    updateProgress(25, `Fetching content for ${candidateFiles.length} eligible files...`);

    let remainingBudget = MAX_CHUNK_TOKENS * 10; // ~60K tokens total
    const fetchedFiles: Array<{ path: string; content: string; size: number; priority: 'high' | 'normal' }> = [];

    for (let i = 0; i < candidateFiles.length; i++) {
      const entry = candidateFiles[i];
      if (remainingBudget <= 0) break;

      if (i % 20 === 0) {
        updateProgress(
          25 + Math.floor((i / candidateFiles.length) * 30),
          `Fetching file ${i + 1}/${candidateFiles.length}...`
        );
      }

      const content = await fetchFileContent(owner, repo, entry.path, entry.size ?? MAX_FILE_BYTES);
      if (!content) continue;

      remainingBudget -= estimateTokens(content);

      fetchedFiles.push({
        path: entry.path,
        content,
        size: entry.size ?? 0,
        priority: isHighPriority(entry.path) ? 'high' : 'normal',
      });
    }

    updateProgress(60, `Fetched ${fetchedFiles.length} files. Building analysis chunks...`);

    // Step 4: Build chunks
    const chunks = buildChunks(
      fetchedFiles.map((f) => ({ path: f.path, content: f.content })),
      MAX_CHUNK_TOKENS
    );

    const fileIndex = fetchedFiles.map((f) => ({
      path: f.path,
      size: f.size,
      priority: f.priority,
    }));

    // Step 5: Run LLM analysis
    updateProgress(70, `Running AI analysis across ${chunks.length} chunk(s)...`);
    const analysisResult = await runLLMAnalysis(owner, repo, branch, chunks, fileIndex);

    // Correct file counts
    analysisResult.filesAnalyzed = fetchedFiles.length;
    analysisResult.totalFilesFound = allBlobs.length;

    // Step 6: Complete
    jobStore[jobId] = {
      ...jobStore[jobId],
      status: AnalysisStatus.COMPLETE,
      progress: 100,
      progressMessage: 'Analysis complete.',
      result: analysisResult,
      completedAt: new Date().toISOString(),
    };

    logger.info(
      `Analysis ${jobId} complete. ${fetchedFiles.length}/${allBlobs.length} files analyzed.`,
      'codebaseAnalysis'
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown analysis error';
    logger.error(`Analysis ${jobId} failed: ${message}`, 'codebaseAnalysis');
    jobStore[jobId] = {
      ...jobStore[jobId],
      status: AnalysisStatus.FAILED,
      progress: 100,
      progressMessage: `Analysis failed: ${message}`,
      error: message,
      completedAt: new Date().toISOString(),
    };
  }
}

// ── Public Service API ────────────────────────────────────────────────────

export class CodebaseAnalysisService {
  /**
   * Starts an async analysis job for a GitHub repository.
   * Returns the jobId immediately — poll getJob() for status.
   */
  static startAnalysis(input: StartAnalysisInput): string {
    const jobId = createJobId();

    jobStore[jobId] = {
      jobId,
      projectId: input.projectId,
      owner: input.owner,
      repo: input.repo,
      branch: input.branch,
      status: AnalysisStatus.RUNNING,
      progress: 0,
      progressMessage: 'Starting analysis...',
      startedAt: new Date().toISOString(),
    };

    // Run without blocking
    setImmediate(() => runAnalysis(jobId, input));

    return jobId;
  }

  /** Returns current state of a job (without large result unless complete). */
  static getJob(jobId: string): AnalysisJob | null {
    return jobStore[jobId] ?? null;
  }

  /** Lists all jobs, newest first, optionally filtered by projectId. */
  static listJobs(projectId?: string): AnalysisJob[] {
    const all = Object.values(jobStore).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    if (projectId) return all.filter((j) => j.projectId === projectId);
    return all;
  }

  /** Removes jobs older than maxAgeMs (default 24 hours). */
  static pruneOldJobs(maxAgeMs = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;
    Object.keys(jobStore).forEach((id) => {
      if (new Date(jobStore[id].startedAt).getTime() < cutoff) {
        delete jobStore[id];
      }
    });
  }
}
