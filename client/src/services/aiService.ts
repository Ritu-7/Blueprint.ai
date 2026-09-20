import { generateProjectFromPrompt, detectTemplateKind } from '@/lib/templates';
import { fullBlueprintSchema, type FullBlueprint } from '@/validators/blueprintSchema';
import type { TemplateKind } from '@/types/project';
import { logger } from '@/lib/logger/logger';
import { env } from '@/config/env';

export class AIService {
  static generateProject(prompt: string): FullBlueprint {
    logger.info(`Generating structured 12-section blueprint for: "${prompt.slice(0, 50)}..."`, 'aiService');

    const kind = detectTemplateKind(prompt);
    const baseGenerated = generateProjectFromPrompt(prompt);

    // Build complete structured 12-section model
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

    // Validate structured JSON against Zod schema
    const validated = fullBlueprintSchema.parse(rawData);
    logger.info(`Successfully validated structured 12-section blueprint "${validated.name}"`, 'aiService');
    return validated;
  }

  static detectKind(prompt: string): TemplateKind {
    return detectTemplateKind(prompt);
  }
}
