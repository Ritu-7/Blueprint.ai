import { generateProjectFromPrompt, detectTemplateKind } from '@/lib/templates';
import { fullBlueprintSchema, type FullBlueprint } from '@/validators/blueprintSchema';
import type { TemplateKind } from '@/types/project';
import { logger } from '@/lib/logger/logger';
import { env } from '@/config/env';

// ─── Provider model config (overridable via env) ─────────────────────────────
const GEMINI_MODELS: string[] = (process.env.GEMINI_MODELS ?? 'gemini-3.8-flash,gemini-3.7-flash,gemini-flash-latest,gemini-flash-lite-latest')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** Network-level errors — bail out of the whole provider immediately */
const NETWORK_ERROR_CODES = new Set([
  'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET',
  'ERR_NETWORK', 'ECONNRESET',
]);

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  if (msg.includes('fetch failed') || msg.includes('enotfound') ||
      msg.includes('econnrefused') || msg.includes('etimedout') ||
      msg.includes('network') || msg.includes('und_err')) return true;
  // Node.js `cause` chain
  const cause = (err as NodeJS.ErrnoException & { cause?: unknown }).cause;
  if (cause && typeof cause === 'object') {
    const c = cause as Record<string, unknown>;
    if (typeof c.code === 'string' && NETWORK_ERROR_CODES.has(c.code)) return true;
    if (typeof c.message === 'string') {
      const cm = c.message.toLowerCase();
      if (cm.includes('enotfound') || cm.includes('econnrefused') || cm.includes('etimedout')) return true;
    }
  }
  return false;
}

function logFetchError(label: string, err: unknown): void {
  if (!(err instanceof Error)) {
    logger.warn(`${label}: ${String(err)}`, 'aiService');
    return;
  }
  const cause = (err as NodeJS.ErrnoException & { cause?: unknown }).cause;
  const causeInfo = cause
    ? ` | cause: ${JSON.stringify({ code: (cause as Record<string, unknown>).code, message: (cause as Record<string, unknown>).message })}`
    : '';
  logger.warn(`${label}: ${err.message}${causeInfo}`, 'aiService');
}

// ─── Normalize userStories regardless of field name shape ────────────────────
type RawStory = Record<string, unknown>;

function normalizeUserStory(item: RawStory): { asA: string; iWantTo: string; soThat: string } {
  // Already correct
  if (typeof item.asA === 'string' && typeof item.iWantTo === 'string' && typeof item.soThat === 'string') {
    return { asA: item.asA, iWantTo: item.iWantTo, soThat: item.soThat };
  }

  // Try parsing "As a X, I want to Y, so that Z" string formats
  const candidateStr = [item.story, item.text, item.userStory, item.description]
    .find((v): v is string => typeof v === 'string');
  if (candidateStr) {
    const m = candidateStr.match(/as\s+a[n]?\s+(.+?)[,;]\s+i\s+want\s+to\s+(.+?)[,;]\s+so\s+that\s+(.+)/i);
    if (m) return { asA: m[1].trim(), iWantTo: m[2].trim(), soThat: m[3].trim() };
  }

  return {
    asA: String(item.asA ?? item.as_a ?? item.role ?? item.persona ?? item.user ?? 'User'),
    iWantTo: String(item.iWantTo ?? item.i_want_to ?? item.want ?? item.goal ?? item.action ?? item.objective ?? ''),
    soThat: String(item.soThat ?? item.so_that ?? item.benefit ?? item.reason ?? item.value ?? ''),
  };
}

// ─── General field normalization before Zod parse ────────────────────────────
function normalizeNarrativeFields(merged: Record<string, unknown>): void {
  if (Array.isArray(merged.userStories)) {
    merged.userStories = (merged.userStories as RawStory[]).map(normalizeUserStory);
  }
  if (Array.isArray(merged.nonFunctionalRequirements)) {
    merged.nonFunctionalRequirements = (merged.nonFunctionalRequirements as RawStory[]).map((item) => ({
      category: item.category ?? item.type ?? item.name ?? 'General',
      requirement: item.requirement ?? item.description ?? item.text ?? item.detail ??
        String(Object.values(item).find((v) => typeof v === 'string' && v !== item.category) ?? ''),
    }));
  }
  if (Array.isArray(merged.functionalRequirements)) {
    merged.functionalRequirements = (merged.functionalRequirements as RawStory[]).map((item) => ({
      id: item.id ?? `FR-${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`,
      category: item.category ?? item.type ?? 'General',
      description: item.description ?? item.requirement ?? item.text ?? item.detail ?? '',
    }));
  }
  if (Array.isArray(merged.coreFeatures)) {
    merged.coreFeatures = (merged.coreFeatures as RawStory[]).map((item) => ({
      name: item.name ?? item.title ?? 'Feature',
      description: item.description ?? item.detail ?? item.summary ?? '',
      priority: (['low', 'medium', 'high', 'critical'] as string[]).includes(String(item.priority))
        ? item.priority
        : 'high',
    }));
  }
}

// ─── Build + validate merged blueprint (with optional repair retry) ───────────
async function buildAndValidate(
  aiNarrative: Record<string, unknown>,
  deterministic: FullBlueprint,
  modelLabel: string,
  repairFn?: (bad: string, zodErr: string) => Promise<Record<string, unknown> | null>
): Promise<FullBlueprint | null> {
  const merged: Record<string, unknown> = { ...deterministic };
  for (const field of NARRATIVE_FIELDS) {
    if (field in aiNarrative && aiNarrative[field] !== null && aiNarrative[field] !== undefined) {
      merged[field] = aiNarrative[field];
    }
  }
  normalizeNarrativeFields(merged);

  try {
    return fullBlueprintSchema.parse(merged);
  } catch (zodErr: unknown) {
    const zodMsg = zodErr instanceof Error ? zodErr.message : String(zodErr);
    logger.warn(`${modelLabel} Zod validation failed — attempting repair: ${zodMsg.slice(0, 200)}`, 'aiService');

    if (repairFn) {
      const repaired = await repairFn(JSON.stringify(merged), zodMsg);
      if (repaired) {
        normalizeNarrativeFields(repaired as Record<string, unknown>);
        try {
          return fullBlueprintSchema.parse(repaired);
        } catch {
          logger.warn(`${modelLabel} repair attempt also failed Zod validation`, 'aiService');
        }
      }
    }
    return null;
  }
}

// ─── Narrative fields list ────────────────────────────────────────────────────
const NARRATIVE_FIELDS = [
  'overview', 'problemStatement', 'targetUsers', 'userRoles',
  'coreFeatures', 'functionalRequirements', 'nonFunctionalRequirements',
  'userStories', 'mainWorkflows', 'techStack', 'developmentPhases', 'potentialRisks',
] as const;

type NarrativeField = (typeof NARRATIVE_FIELDS)[number];

// ─── Blueprint system prompt (shared) ────────────────────────────────────────
function buildSystemPrompt(prompt: string): string {
  return `You are a senior product architect. Return ONLY valid JSON — no markdown, no code fences.

Application idea: "${prompt}"

Return a single JSON object with EXACTLY these keys:
{
  "overview": { "title": "string", "tagline": "string", "description": "string" },
  "problemStatement": { "coreProblem": "string", "painPoints": ["string", "string", "string"] },
  "targetUsers": ["string", "string", "string"],
  "userRoles": [{ "role": "string", "description": "string", "permissions": ["string"] }],
  "coreFeatures": [{ "name": "string", "description": "string", "priority": "critical" }],
  "functionalRequirements": [{ "id": "FR-01", "category": "string", "description": "string" }],
  "nonFunctionalRequirements": [{ "category": "string", "requirement": "string" }],
  "userStories": [
    { "asA": "Developer", "iWantTo": "enter a product prompt", "soThat": "I get a complete blueprint" }
  ],
  "mainWorkflows": [{ "name": "string", "steps": ["string", "string", "string"] }],
  "techStack": { "frontend": ["string"], "backend": ["string"], "database": ["string"], "auth": ["string"], "hosting": ["string"] },
  "developmentPhases": [{ "phase": "string", "title": "string", "deliverables": ["string"] }],
  "potentialRisks": [{ "risk": "string", "impact": "medium", "mitigation": "string" }]
}

CRITICAL RULES:
- userStories items MUST use exactly these key names: "asA", "iWantTo", "soThat". No other key names.
- impact must be exactly "low", "medium", or "high".
- priority must be exactly "low", "medium", "high", or "critical".
- coreFeatures: at least 3 items. functionalRequirements: at least 3 items (FR-01, FR-02, ...). userStories: at least 2 items. potentialRisks: at least 2 items.
- Every string must be specific and relevant to: "${prompt}"
- Return ONLY the JSON object.`;
}

export class AIService {
  private static _keysLogged = false;

  private static logKeyStatus(): void {
    if (AIService._keysLogged) return;
    AIService._keysLogged = true;
    const geminiSet = !!(env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    logger.info(`AI provider key - Gemini: ${geminiSet}`, 'aiService');
    logger.info(`Gemini models: ${GEMINI_MODELS.join(', ')}`, 'aiService');
  }

  // ─── Deterministic fallback ─────────────────────────────────────────────────
  private static generateDeterministic(prompt: string): FullBlueprint {
    logger.info(`Generating structured 12-section blueprint for: "${prompt.slice(0, 50)}..."`, 'aiService');

    const kind = detectTemplateKind(prompt);
    const baseGenerated = generateProjectFromPrompt(prompt);

    const rawData = {
      name: baseGenerated.name,
      kind,
      description: baseGenerated.description,
      overview: {
        title: baseGenerated.name,
        tagline: `AI-architected full-stack ${kind} application workspace`,
        description: `Blueprint for "${prompt}" featuring live responsive UI components, PostgreSQL schema, REST API contract, and complete file tree.`,
      },
      problemStatement: {
        coreProblem: `Fragmented tools and long planning cycles delay shipping product ideas into working applications for ${prompt}.`,
        painPoints: [
          'Manual setup of backend schema, routes, and authentication.',
          'Disconnect between design specs and implementation code.',
          'Slow feedback loops when validating product requirements.',
        ],
      },
      targetUsers: [
        'Early adopters looking for streamlined workflows.',
        'Product managers and tech leads validating app blueprints.',
        'Full-stack developers iterating rapidly.',
      ],
      userRoles: [
        {
          role: 'Administrator',
          description: 'Full access to workspace settings, member permissions, and project deployment.',
          permissions: ['manage_users', 'edit_schema', 'deploy_app', 'configure_api'],
        },
        {
          role: 'Member / User',
          description: 'Standard access to create, view, and interact with generated project features.',
          permissions: ['view_blueprint', 'edit_code', 'run_tests'],
        },
      ],
      coreFeatures: [
        { name: 'Interactive Live Browser Preview', description: 'Instant responsive preview rendering generated TSX components with viewport controls.', priority: 'critical' as const },
        { name: 'PostgreSQL Schema Engine', description: 'Auto-generated SQL database migration schema with primary keys, indexes, and RLS policies.', priority: 'critical' as const },
        { name: 'REST API Terminal Specs', description: 'Clear REST endpoint contracts with structured request and response JSON shapes.', priority: 'high' as const },
        { name: 'GitHub Repository Sync', description: 'Direct push to GitHub repository with commit history and pull request automation.', priority: 'high' as const },
      ],
      functionalRequirements: [
        { id: 'FR-01', category: 'Auth', description: 'System must authenticate users via Clerk JWT session tokens.' },
        { id: 'FR-02', category: 'Database', description: 'System must enforce Row Level Security on all private database queries.' },
        { id: 'FR-03', category: 'IDE', description: 'Workspace must provide full file tree inspection and code copying.' },
      ],
      nonFunctionalRequirements: [
        { category: 'Performance', requirement: 'API endpoints respond within 200ms latency.' },
        { category: 'Security', requirement: 'All secrets kept in environment variables with zero client-side exposure.' },
        { category: 'Reliability', requirement: 'Deterministic fallback mode ensures 99.9% generation availability.' },
      ],
      userStories: [
        { asA: 'Developer', iWantTo: 'enter a simple product prompt', soThat: 'I can inspect complete generated source files and database SQL.' },
        { asA: 'Product Lead', iWantTo: 'review generated architecture and API specifications', soThat: 'our engineering team can align quickly before sprint planning.' },
      ],
      mainWorkflows: [
        {
          name: 'Prompt to Blueprint Workflow',
          steps: [
            'User inputs application requirements in prompt box.',
            'AI Engine analyzes prompt and selects optimal architecture template.',
            'Engine constructs 12-section blueprint, SQL schema, REST API specs, and UI files.',
            'Blueprint is validated against Zod schema and saved to Supabase version history.',
          ],
        },
      ],
      techStack: {
        frontend: ['Next.js 14 App Router', 'React 18', 'Tailwind CSS', 'Framer Motion'],
        backend: ['Next.js Node.js Route Handlers', 'TypeScript'],
        database: ['Supabase PostgreSQL', 'Row Level Security'],
        auth: ['Clerk Authentication'],
        hosting: ['Vercel Edge Network'],
      },
      developmentPhases: [
        { phase: 'Phase 1 - MVP', title: 'Core Architecture & Generation', deliverables: ['Prompt engine', 'Schema generation', 'Live Browser preview', 'Supabase integration'] },
        { phase: 'Phase 2 - Collaboration', title: 'GitHub & Versioning', deliverables: ['GitHub Push & PR', 'Blueprint version snapshots', 'AI Project Assistant'] },
        { phase: 'Phase 3 - Production', title: 'Security & Quality Audit', deliverables: ['Automated code reviews', 'Vulnerability findings', 'Health score metrics'] },
      ],
      potentialRisks: [
        { risk: 'External AI API rate limiting or network downtime', impact: 'medium' as const, mitigation: 'Server-side fallback engine generates valid Zod-compliant blueprint models deterministically.' },
        { risk: 'Cross-tenant data exposure', impact: 'high' as const, mitigation: 'Enforce Supabase Row Level Security (RLS) on all 26 database tables.' },
      ],
      uiCode: baseGenerated.uiCode,
      schema: baseGenerated.schema,
      api: baseGenerated.api,
      preview: baseGenerated.preview,
      files: baseGenerated.files,
    };

    const validated = fullBlueprintSchema.parse(rawData);
    logger.info(`Successfully validated structured 12-section blueprint "${validated.name}"`, 'aiService');
    return validated;
  }

  // ─── Gemini (Google) ────────────────────────────────────────────────────────
  private static async generateWithGemini(
    prompt: string,
    geminiKey: string,
    deterministic: FullBlueprint
  ): Promise<FullBlueprint | null> {
    const baseUrl = process.env.GEMINI_BASE_URL ?? process.env.GOOGLE_GENERATIVE_AI_BASE_URL ?? 'https://generativelanguage.googleapis.com';
    const systemPrompt = buildSystemPrompt(prompt);

    for (const model of GEMINI_MODELS) {
      try {
        const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${geminiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errText = await res.text();
          logger.warn(`Gemini model ${model} HTTP ${res.status}: ${errText.slice(0, 150)}`, 'aiService');
          continue;
        }

        const responseData = await res.json();
        const text: string = responseData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (!text) continue;

        let aiNarrative: Record<string, unknown>;
        try {
          const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
          aiNarrative = JSON.parse(cleaned);
        } catch {
          logger.warn(`Gemini model ${model} returned unparseable JSON`, 'aiService');
          continue;
        }

        const repairFn = async (badJson: string, zodErr: string) => {
          try {
            const repairRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `Fix this JSON to match the schema. Return JSON only.\n\nErrors:\n${zodErr.slice(0, 500)}\n\nJSON:\n${badJson.slice(0, 2000)}` }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 4096, responseMimeType: 'application/json' },
              }),
              signal: AbortSignal.timeout(15000),
            });
            if (!repairRes.ok) return null;
            const rd = await repairRes.json();
            const rt: string = rd?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (!rt) return null;
            return JSON.parse(rt.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
          } catch { return null; }
        };

        const result = await buildAndValidate(aiNarrative, deterministic, `Gemini(${model})`, repairFn);
        if (result) {
          logger.info(`AI-enhanced blueprint (${model}) validated for "${prompt.slice(0, 50)}..."`, 'aiService');
          return result;
        }
      } catch (err: unknown) {
        logFetchError(`Gemini model ${model} error`, err);
        // Network-level failure — bail out of Gemini entirely
        if (isNetworkError(err)) {
          logger.warn('Gemini network failure — skipping remaining Gemini models', 'aiService');
          return null;
        }
      }
    }

    return null;
  }

  // ─── Public: generateProject ────────────────────────────────────────────────
  static async generateProject(prompt: string): Promise<FullBlueprint & { meta?: { source: string; reason: string } }> {
    AIService.logKeyStatus();

    const deterministic = AIService.generateDeterministic(prompt);

    // Try Gemini
    const geminiKey = env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey) {
      const geminiResult = await AIService.generateWithGemini(prompt, geminiKey, deterministic);
      if (geminiResult) return geminiResult;
    }

    // Final fallback — include meta so the UI can show a notice
    logger.info('All AI providers unavailable — returning deterministic blueprint with fallback meta', 'aiService');
    return {
      ...deterministic,
      meta: {
        source: 'fallback',
        reason: !geminiKey
          ? 'No API keys configured'
          : 'All AI provider requests failed (network error or quota exceeded)',
      },
    };
  }

  static detectKind(prompt: string): TemplateKind {
    return detectTemplateKind(prompt);
  }

  // ─── chatEdit ───────────────────────────────────────────────────────────────
  static async chatEdit(params: {
    currentFile: { path: string; content: string };
    otherFilesSummary?: unknown;
    instruction: string;
  }): Promise<{ modifiedFiles: Array<{ path: string; newContent: string }> }> {
    const { currentFile, otherFilesSummary, instruction } = params;

    const applyDeterministicPatch = (): { modifiedFiles: Array<{ path: string; newContent: string }> } => ({
      modifiedFiles: [{
        path: currentFile.path,
        newContent: `// AI Edit: ${instruction}\n${currentFile.content}`,
      }],
    });

    const geminiKey = env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiKey) {
      logger.info('No Gemini API key available for chatEdit — using fallback patch', 'aiService');
      return applyDeterministicPatch();
    }

    const summaryText = typeof otherFilesSummary === 'string'
      ? otherFilesSummary
      : JSON.stringify(otherFilesSummary, null, 2);

    const promptText = `You are a senior software developer editing an existing code file based on a user instruction.

Current Active File: "${currentFile.path}"
Content:
\`\`\`
${currentFile.content}
\`\`\`

Summary of other files in project:
${summaryText || 'None'}

User Instruction:
"${instruction}"

Your Task:
Generate ONLY the modified file(s) patched according to the user instruction. Do NOT generate a whole new project blueprint.

Return a single JSON object with EXACTLY this structure:
{
  "modifiedFiles": [
    {
      "path": "${currentFile.path}",
      "newContent": "complete updated file code"
    }
  ]
}

Rules:
- Include ONLY changed file(s) in "modifiedFiles" array.
- Provide complete, full updated source code for "newContent".
- Return valid JSON — no markdown fences outside the JSON object.`;

    try {
      const baseUrl = process.env.GEMINI_BASE_URL ?? process.env.GOOGLE_GENERATIVE_AI_BASE_URL ?? 'https://generativelanguage.googleapis.com';
      for (const model of GEMINI_MODELS) {
        try {
          const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 4096, responseMimeType: 'application/json' },
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            const errText = await res.text();
            logger.warn(`chatEdit Gemini model ${model} HTTP ${res.status}: ${errText.slice(0, 150)}`, 'aiService');
            continue;
          }

          const responseData = await res.json();
          const text: string = responseData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          if (!text) continue;

          const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
          const parsed = JSON.parse(cleaned);

          if (parsed && Array.isArray(parsed.modifiedFiles) && parsed.modifiedFiles.length > 0) {
            return {
              modifiedFiles: parsed.modifiedFiles.map((item: Record<string, unknown>) => ({
                path: String(item.path || currentFile.path),
                newContent: String(item.newContent || currentFile.content),
              })),
            };
          }
        } catch (err: unknown) {
          logFetchError(`chatEdit Gemini model ${model} error`, err);
          if (isNetworkError(err)) {
            logger.warn('chatEdit Gemini network failure — using fallback patch', 'aiService');
            break;
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`chatEdit failed: ${msg} — using fallback patch`, 'aiService');
    }

    return applyDeterministicPatch();
  }
}