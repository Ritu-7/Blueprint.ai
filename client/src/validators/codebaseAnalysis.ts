import { z } from 'zod';

// ── File filtering constants ────────────────────────────────────────────────

/** Directories to always skip when traversing a repository tree. */
export const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage',
  '.nyc_output', '.turbo', '.vercel', '__pycache__', 'venv', '.venv',
  'vendor', 'target', '.gradle', 'Pods', '.idea', '.vscode', '.DS_Store',
]);

/** File extensions to always skip (binary / media / lock / generated). */
export const SKIP_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'avif',
  'mp4', 'mov', 'avi', 'webm', 'mp3', 'wav', 'ogg',
  'pdf', 'docx', 'xlsx', 'zip', 'tar', 'gz', 'rar', '7z',
  'ttf', 'woff', 'woff2', 'eot', 'otf',
  'lock', 'snap', 'map', 'min.js', 'min.css',
  'pyc', 'pyo', 'class', 'jar', 'war', 'dll', 'so', 'dylib', 'exe',
]);

/** Files that are high-priority for analysis (always include if present). */
export const HIGH_PRIORITY_FILES = new Set([
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'requirements.txt', 'Pipfile', 'pyproject.toml', 'Cargo.toml', 'go.mod',
  'tsconfig.json', 'jsconfig.json', 'next.config.js', 'next.config.ts',
  'vite.config.ts', 'vite.config.js', 'webpack.config.js',
  'docker-compose.yml', 'docker-compose.yaml', 'Dockerfile',
  '.env.example', '.env.sample',
  'README.md', 'CONTRIBUTING.md', 'CHANGELOG.md',
  'supabase/schema.sql', 'prisma/schema.prisma', 'schema.prisma',
]);

/** Max bytes per file to include in analysis context. */
export const MAX_FILE_BYTES = 60_000; // 60KB

/** Estimated characters per token (conservative). */
export const CHARS_PER_TOKEN = 4;

/** Max tokens per analysis chunk sent to the LLM. */
export const MAX_CHUNK_TOKENS = 6_000;

// ── Analysis Job Status ──────────────────────────────────────────────────────

export const AnalysisStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETE: 'complete',
  FAILED: 'failed',
} as const;
export type AnalysisStatusType = typeof AnalysisStatus[keyof typeof AnalysisStatus];

// ── Analysis Result Schemas ──────────────────────────────────────────────────

export const technologyItemSchema = z.object({
  name: z.string(),
  category: z.enum(['language', 'framework', 'library', 'database', 'tool', 'platform', 'testing', 'ci_cd']),
  version: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const importantFileSchema = z.object({
  path: z.string(),
  purpose: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
});

export const apiEndpointSchema = z.object({
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ANY']),
  description: z.string(),
  file: z.string(),
  authenticated: z.boolean().optional(),
});

export const dependencyEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(['imports', 'extends', 'implements', 'uses', 'depends_on']),
});

export const securityFindingSchema = z.object({
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  title: z.string(),
  description: z.string(),
  file: z.string().optional(),
  recommendation: z.string(),
});

export const technicalDebtItemSchema = z.object({
  severity: z.enum(['high', 'medium', 'low']),
  category: z.enum(['complexity', 'duplication', 'outdated', 'missing_types', 'poor_error_handling', 'other']),
  description: z.string(),
  file: z.string().optional(),
  impact: z.string(),
});

export const gapItemSchema = z.object({
  severity: z.enum(['high', 'medium', 'low']),
  description: z.string(),
  file: z.string().optional(),
  suggestion: z.string(),
});

export const codebaseAnalysisResultSchema = z.object({
  // Metadata
  repoFullName: z.string(),
  branch: z.string(),
  analyzedAt: z.string(),
  filesAnalyzed: z.number(),
  totalFilesFound: z.number(),
  tokensUsed: z.number(),

  // Section 1: Architecture Summary
  architectureSummary: z.object({
    projectType: z.string(), // e.g. "Full-stack Next.js web application"
    overview: z.string(),    // 3-5 sentence narrative
    layers: z.array(z.string()), // e.g. ["Frontend (React)", "API Routes", "Supabase DB"]
    patterns: z.array(z.string()), // e.g. ["Service Layer", "Repository Pattern"]
    entryPoints: z.array(z.string()), // file paths
  }),

  // Section 2: Technology Map
  technologyMap: z.array(technologyItemSchema),

  // Section 3: Important Files
  importantFiles: z.array(importantFileSchema),

  // Section 4: API Map
  apiMap: z.array(apiEndpointSchema),

  // Section 5: Dependency Map (key internal module relationships)
  dependencyMap: z.array(dependencyEdgeSchema),

  // Section 6: Security Findings
  securityFindings: z.array(securityFindingSchema),

  // Section 7: Technical Debt
  technicalDebt: z.array(technicalDebtItemSchema),

  // Section 8: Testing Gaps
  testingGaps: z.array(gapItemSchema),

  // Section 9: Documentation Gaps
  documentationGaps: z.array(gapItemSchema),
});

export type TechnologyItem = z.infer<typeof technologyItemSchema>;
export type ImportantFile = z.infer<typeof importantFileSchema>;
export type ApiEndpoint = z.infer<typeof apiEndpointSchema>;
export type DependencyEdge = z.infer<typeof dependencyEdgeSchema>;
export type SecurityFinding = z.infer<typeof securityFindingSchema>;
export type TechnicalDebtItem = z.infer<typeof technicalDebtItemSchema>;
export type GapItem = z.infer<typeof gapItemSchema>;
export type CodebaseAnalysisResult = z.infer<typeof codebaseAnalysisResultSchema>;

// ── Job Types ────────────────────────────────────────────────────────────────

export interface AnalysisJob {
  jobId: string;
  projectId?: string;
  owner: string;
  repo: string;
  branch: string;
  status: AnalysisStatusType;
  progress: number; // 0-100
  progressMessage: string;
  result?: CodebaseAnalysisResult;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export const startAnalysisSchema = z.object({
  owner: z.string().trim().min(1, 'Owner required'),
  repo: z.string().trim().min(1, 'Repository required'),
  branch: z.string().default('main'),
  projectId: z.string().uuid().optional(),
});

export type StartAnalysisInput = z.infer<typeof startAnalysisSchema>;
