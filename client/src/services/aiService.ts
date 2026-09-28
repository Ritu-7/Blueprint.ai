import { generateProjectFromPrompt, detectTemplateKind } from '@/lib/templates';
import { fullBlueprintSchema, type FullBlueprint } from '@/validators/blueprintSchema';
import type { TemplateKind } from '@/types/project';
import { logger } from '@/lib/logger/logger';
import { env } from '@/config/env';

const NARRATIVE_FIELDS = [
  'overview',
  'problemStatement',
  'targetUsers',
  'userRoles',
  'coreFeatures',
  'functionalRequirements',
  'nonFunctionalRequirements',
  'userStories',
  'mainWorkflows',
  'techStack',
  'developmentPhases',
  'potentialRisks',
] as const;

type NarrativeField = (typeof NARRATIVE_FIELDS)[number];

export class AIService {
  private static generateDeterministic(prompt: string): FullBlueprint {
    logger.info(
      `Generating structured 12-section blueprint for: "${prompt.slice(0, 50)}..."`,
      'aiService'
    );

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
        {
          name: 'Interactive Live Browser Preview',
          description: 'Instant responsive preview rendering generated TSX components with viewport controls.',
          priority: 'critical' as const,
        },
        {
          name: 'PostgreSQL Schema Engine',
          description: 'Auto-generated SQL database migration schema with primary keys, indexes, and RLS policies.',
          priority: 'critical' as const,
        },
        {
          name: 'REST API Terminal Specs',
          description: 'Clear REST endpoint contracts with structured request and response JSON shapes.',
          priority: 'high' as const,
        },
        {
          name: 'GitHub Repository Sync',
          description: 'Direct push to GitHub repository with commit history and pull request automation.',
          priority: 'high' as const,
        },
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
        {
          asA: 'Developer',
          iWantTo: 'enter a simple product prompt',
          soThat: 'I can inspect complete generated source files and database SQL.',
        },
        {
          asA: 'Product Lead',
          iWantTo: 'review generated architecture and API specifications',
          soThat: 'our engineering team can align quickly before sprint planning.',
        },
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
        {
          phase: 'Phase 1 - MVP',
          title: 'Core Architecture & Generation',
          deliverables: ['Prompt engine', 'Schema generation', 'Live Browser preview', 'Supabase integration'],
        },
        {
          phase: 'Phase 2 - Collaboration',
          title: 'GitHub & Versioning',
          deliverables: ['GitHub Push & PR', 'Blueprint version snapshots', 'AI Project Assistant'],
        },
        {
          phase: 'Phase 3 - Production',
          title: 'Security & Quality Audit',
          deliverables: ['Automated code reviews', 'Vulnerability findings', 'Health score metrics'],
        },
      ],
      potentialRisks: [
        {
          risk: 'External AI API rate limiting or network downtime',
          impact: 'medium' as const,
          mitigation: 'Server-side fallback engine generates valid Zod-compliant blueprint models deterministically.',
        },
        {
          risk: 'Cross-tenant data exposure',
          impact: 'high' as const,
          mitigation: 'Enforce Supabase Row Level Security (RLS) on all 26 database tables.',
        },
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

  // ─── Claude (Anthropic) AI Generator ─────────────────────────────────────
  private static async generateWithClaude(prompt: string, apiKey: string, deterministic: FullBlueprint): Promise<FullBlueprint | null> {
    try {
      logger.info(`Calling Claude API (Anthropic) for prompt: "${prompt.slice(0, 50)}..."`, 'aiService');

      const systemInstruction = `You are a senior product architect. Given the following application idea, generate ONLY the narrative and planning sections of a product blueprint as strict JSON — no markdown, no code fences, no extra prose.

Application idea: "${prompt}"

Return a single JSON object with EXACTLY these keys and types:

{
  "overview": {
    "title": "string — concise app name",
    "tagline": "string — one-line value proposition",
    "description": "string — 2-3 sentence description tailored to prompt"
  },
  "problemStatement": {
    "coreProblem": "string — core problem specific to prompt",
    "painPoints": ["string", "string", "string"]
  },
  "targetUsers": ["string", "string", "string"],
  "userRoles": [
    { "role": "string", "description": "string", "permissions": ["string"] }
  ],
  "coreFeatures": [
    { "name": "string", "description": "string", "priority": "critical" }
  ],
  "functionalRequirements": [
    { "id": "FR-01", "category": "string", "description": "string" }
  ],
  "nonFunctionalRequirements": [
    { "category": "string", "requirement": "string" }
  ],
  "userStories": [
    { "asA": "string", "iWantTo": "string", "soThat": "string" }
  ],
  "mainWorkflows": [
    { "name": "string", "steps": ["string", "string", "string", "string"] }
  ],
  "techStack": {
    "frontend": ["string"],
    "backend": ["string"],
    "database": ["string"],
    "auth": ["string"],
    "hosting": ["string"]
  },
  "developmentPhases": [
    { "phase": "string", "title": "string", "deliverables": ["string"] }
  ],
  "potentialRisks": [
    { "risk": "string", "impact": "medium", "mitigation": "string" }
  ]
}

Rules:
- Impact must be exactly "low", "medium", or "high".
- Priority must be exactly "low", "medium", "high", or "critical".
- Return ONLY the JSON object.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [{ role: 'user', content: systemInstruction }],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Claude API HTTP ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const resData = await response.json();
      const rawContent = resData.content?.[0]?.text || '';
      if (!rawContent) throw new Error('Claude returned empty content');

      const cleanedJson = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const aiNarrative = JSON.parse(cleanedJson);

      const merged: Record<string, unknown> = { ...deterministic };
      for (const field of NARRATIVE_FIELDS) {
        if (field in aiNarrative && aiNarrative[field] !== null && aiNarrative[field] !== undefined) {
          (merged as Record<NarrativeField, unknown>)[field] = aiNarrative[field];
        }
      }

      const validated = fullBlueprintSchema.parse(merged);
      logger.info(`Successfully generated Claude AI blueprint for "${prompt.slice(0, 50)}..."`, 'aiService');
      return validated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Claude API processing failed: ${msg}`, 'aiService');
      return null;
    }
  }

  // ─── Public: async generateProject (Claude -> Gemini -> Deterministic Fallback)
  static async generateProject(prompt: string): Promise<FullBlueprint> {
    const deterministic = AIService.generateDeterministic(prompt);

    const claudeKey = env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (claudeKey) {
      const claudeResult = await AIService.generateWithClaude(prompt, claudeKey, deterministic);
      if (claudeResult) return claudeResult;
    }

    const geminiKey = env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiKey) {
      return deterministic;
    }

    try {
      const systemPrompt = `You are a senior product architect. Given the following application idea, generate ONLY the narrative and planning sections of a product blueprint as strict JSON — no markdown, no code fences, no extra keys.

Application idea: "${prompt}"

Return a single JSON object with EXACTLY these keys and types (match the schema precisely):

{
  "overview": {
    "title": "string — concise app name",
    "tagline": "string — one-line value proposition",
    "description": "string — 2-3 sentence description tailored to the prompt"
  },
  "problemStatement": {
    "coreProblem": "string — the core problem this app solves, specific to the prompt",
    "painPoints": ["string", "string", "string"]
  },
  "targetUsers": ["string", "string", "string"],
  "userRoles": [
    { "role": "string", "description": "string", "permissions": ["string"] }
  ],
  "coreFeatures": [
    { "name": "string", "description": "string", "priority": "critical|high|medium|low" }
  ],
  "functionalRequirements": [
    { "id": "FR-01", "category": "string", "description": "string" }
  ],
  "nonFunctionalRequirements": [
    { "category": "string", "requirement": "string" }
  ],
  "userStories": [
    { "asA": "string", "iWantTo": "string", "soThat": "string" }
  ],
  "mainWorkflows": [
    { "name": "string", "steps": ["string", "string", "string", "string"] }
  ],
  "techStack": {
    "frontend": ["string"],
    "backend": ["string"],
    "database": ["string"],
    "auth": ["string"],
    "hosting": ["string"]
  },
  "developmentPhases": [
    { "phase": "string", "title": "string", "deliverables": ["string"] }
  ],
  "potentialRisks": [
    { "risk": "string", "impact": "low|medium|high", "mitigation": "string" }
  ]
}

Rules:
- Every string must be specific and relevant to: "${prompt}"
- coreFeatures must have at least 3 items
- functionalRequirements must have at least 3 items (ids: FR-01, FR-02, ...)
- userStories must have at least 2 items
- potentialRisks must have at least 2 items
- impact must be exactly "low", "medium", or "high"
- priority must be exactly "low", "medium", "high", or "critical"
- Return ONLY the JSON object — no prose, no code fences`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`;
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
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
      }

      const responseData = await res.json();
      const text: string = responseData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) throw new Error('Gemini returned empty response');

      let aiNarrative: Record<string, unknown>;
      try {
        const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        aiNarrative = JSON.parse(cleaned);
      } catch {
        throw new Error('Failed to parse Gemini JSON response');
      }

      const merged: Record<string, unknown> = { ...deterministic };
      for (const field of NARRATIVE_FIELDS) {
        if (field in aiNarrative && aiNarrative[field] !== null && aiNarrative[field] !== undefined) {
          (merged as Record<NarrativeField, unknown>)[field] = aiNarrative[field];
        }
      }

      const validated = fullBlueprintSchema.parse(merged);
      logger.info(
        `AI-enhanced blueprint validated for "${prompt.slice(0, 50)}..."`,
        'aiService'
      );
      return validated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(
        `Gemini blueprint generation failed, using deterministic fallback: ${msg}`,
        'aiService'
      );
      return deterministic;
    }
  }

  static detectKind(prompt: string): TemplateKind {
    return detectTemplateKind(prompt);
  }
}
