import { supabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger/logger';
import { AppError } from '@/lib/errors/AppError';
import { AIService } from './aiService';
import type {
  ArchitectureComponent,
  ArchitectureConnection,
  FullArchitecture,
  ComponentType,
} from '@/validators/architectureSchema';

export class ArchitectureService {
  static async fetchArchitecture(projectId: string): Promise<FullArchitecture> {
    logger.info(`Fetching architecture for project ${projectId}`, 'architectureService');

    // Fetch Components
    const { data: compRows, error: compErr } = await supabaseClient
      .from('architecture_components')
      .select('*')
      .eq('project_id', projectId);

    if (compErr) {
      logger.error(`fetchArchitecture components error: ${compErr.message}`, 'architectureService', compErr);
      throw new AppError(`Failed to fetch architecture components: ${compErr.message}`, 500, 'DB_FETCH_ERROR');
    }

    // Fetch Connections
    const { data: connRows, error: connErr } = await supabaseClient
      .from('architecture_connections')
      .select('*')
      .eq('project_id', projectId);

    if (connErr) {
      logger.error(`fetchArchitecture connections error: ${connErr.message}`, 'architectureService', connErr);
      throw new AppError(`Failed to fetch architecture connections: ${connErr.message}`, 500, 'DB_FETCH_ERROR');
    }

    if (!compRows || compRows.length === 0) {
      // Auto-generate if no architecture saved
      return this.generateArchitecture(projectId);
    }

    const components: ArchitectureComponent[] = compRows.map((c) => ({
      id: c.id,
      name: c.name,
      type: (c.type || 'BACKEND').toUpperCase() as ComponentType,
      technology: c.description || 'Next.js / Node.js',
      responsibility: c.description || 'Core service responsibility',
      dependencies: [],
      position: c.position && typeof c.position === 'object' ? c.position : { x: 100, y: 100 },
    }));

    const connections: ArchitectureConnection[] = (connRows || []).map((cn) => ({
      id: cn.id,
      source: cn.source_component_id,
      target: cn.target_component_id,
      protocol: cn.connection_type || 'HTTP/REST',
      description: cn.label || 'Data flow',
    }));

    return {
      project_id: projectId,
      components,
      connections,
    };
  }

  static async saveArchitecture(
    projectId: string,
    components: ArchitectureComponent[],
    connections: ArchitectureConnection[]
  ): Promise<FullArchitecture> {
    logger.info(`Saving architecture for project ${projectId} (${components.length} components)`, 'architectureService');

    // 1. Delete existing records for clean sync
    await supabaseClient.from('architecture_connections').delete().eq('project_id', projectId);
    await supabaseClient.from('architecture_components').delete().eq('project_id', projectId);

    // 2. Insert components
    const compInserts = components.map((c) => ({
      id: c.id.includes('-') && c.id.length > 20 ? c.id : undefined,
      project_id: projectId,
      name: c.name,
      type: c.type.toLowerCase(),
      description: `${c.technology} | ${c.responsibility}`,
      config: { technology: c.technology, responsibility: c.responsibility },
      position: c.position,
    }));

    const { data: savedComps, error: compErr } = await supabaseClient
      .from('architecture_components')
      .insert(compInserts)
      .select();

    if (compErr || !savedComps) {
      logger.error('Failed to insert architecture components', 'architectureService', compErr);
      throw new AppError(`Failed to save components: ${compErr?.message}`, 500, 'DB_INSERT_ERROR');
    }

    // Map legacy string IDs to newly generated UUIDs if necessary
    const idMap: Record<string, string> = {};
    components.forEach((c, idx) => {
      idMap[c.id] = savedComps[idx]?.id || c.id;
    });

    // 3. Insert connections
    const connInserts = connections.map((cn) => ({
      project_id: projectId,
      source_component_id: idMap[cn.source] || cn.source,
      target_component_id: idMap[cn.target] || cn.target,
      connection_type: cn.protocol,
      label: cn.description,
    }));

    if (connInserts.length > 0) {
      const { error: connErr } = await supabaseClient.from('architecture_connections').insert(connInserts);
      if (connErr) {
        logger.error('Failed to insert architecture connections', 'architectureService', connErr);
      }
    }

    return this.fetchArchitecture(projectId);
  }

  static async generateArchitecture(projectId: string): Promise<FullArchitecture> {
    logger.info(`Generating architecture topology for project ${projectId}`, 'architectureService');

    const { data: project } = await supabaseClient.from('projects').select('name, prompt, kind').eq('id', projectId).single();
    const prompt = project?.prompt || 'Full-stack application workspace';
    const kind = project?.kind || 'dashboard';

    const blueprint = AIService.generateProject(prompt);

    // Create 11 structured components with canvas layout grid coordinates
    const components: ArchitectureComponent[] = [
      {
        id: 'comp-1',
        name: `${blueprint.name} UI`,
        type: 'FRONTEND',
        technology: 'Next.js 14 App Router + React 18 + Tailwind',
        responsibility: 'Renders client views, handles UI interactions and responsive browser previews.',
        dependencies: ['comp-2', 'comp-4'],
        position: { x: 50, y: 80 },
      },
      {
        id: 'comp-2',
        name: 'API Gateway & Handlers',
        type: 'BACKEND',
        technology: 'Node.js Route Handlers + TypeScript',
        responsibility: 'Encapsulates business logic, API validation, and database CRUD services.',
        dependencies: ['comp-3', 'comp-5', 'comp-8'],
        position: { x: 340, y: 80 },
      },
      {
        id: 'comp-3',
        name: 'PostgreSQL Database',
        type: 'DATABASE',
        technology: 'Supabase PostgreSQL + RLS Policies',
        responsibility: 'Stores tenant data, versions, requirements, and user projects securely.',
        dependencies: [],
        position: { x: 630, y: 80 },
      },
      {
        id: 'comp-4',
        name: 'Clerk Identity Provider',
        type: 'AUTHENTICATION',
        technology: 'Clerk OAuth 2.0 & JWT Sessions',
        responsibility: 'Manages user sign-up, sign-in, session validation, and multi-tenant org roles.',
        dependencies: [],
        position: { x: 50, y: 280 },
      },
      {
        id: 'comp-5',
        name: 'Object Storage Bucket',
        type: 'STORAGE',
        technology: 'Supabase Storage / AWS S3',
        responsibility: 'Stores generated project zip bundles, assets, and user upload media.',
        dependencies: [],
        position: { x: 340, y: 280 },
      },
      {
        id: 'comp-6',
        name: 'AI Code Generation Engine',
        type: 'AI_SERVICES',
        technology: 'Google Gemini AI + Zod Schema Validation',
        responsibility: 'Generates structured 12-section blueprints, SQL schemas, and TSX files.',
        dependencies: [],
        position: { x: 630, y: 280 },
      },
      {
        id: 'comp-7',
        name: 'GitHub Integration REST API',
        type: 'EXTERNAL_APIS',
        technology: 'GitHub REST API v3',
        responsibility: 'Automates repository creation, tree blobs, commits, and pull requests.',
        dependencies: [],
        position: { x: 50, y: 480 },
      },
      {
        id: 'comp-8',
        name: 'Redis Cache Layer',
        type: 'CACHING',
        technology: 'Redis / Upstash Cache',
        responsibility: 'Caches frequent API requests and prompt tokens for fast response times.',
        dependencies: [],
        position: { x: 340, y: 480 },
      },
      {
        id: 'comp-9',
        name: 'Background Job Queue',
        type: 'QUEUES',
        technology: 'BullMQ / Celery Queue Worker',
        responsibility: 'Processes background AI generation jobs, static analysis, and E2E tests.',
        dependencies: [],
        position: { x: 630, y: 480 },
      },
      {
        id: 'comp-10',
        name: 'Application Telemetry',
        type: 'MONITORING',
        technology: 'Sentry + OpenTelemetry Logging',
        responsibility: 'Monitors runtime errors, performance metrics, and application health scores.',
        dependencies: [],
        position: { x: 195, y: 650 },
      },
      {
        id: 'comp-11',
        name: 'Vercel Edge Deployment',
        type: 'DEPLOYMENT',
        technology: 'Vercel Edge CDN Network',
        responsibility: 'Serves static assets, serverless route handlers, and global edge routing.',
        dependencies: [],
        position: { x: 485, y: 650 },
      },
    ];

    // Data flow connections between components
    const connections: ArchitectureConnection[] = [
      { id: 'conn-1', source: 'comp-1', target: 'comp-2', protocol: 'HTTPS / REST', description: 'Client UI API requests' },
      { id: 'conn-2', source: 'comp-1', target: 'comp-4', protocol: 'OAuth 2.0 / JWT', description: 'User authentication' },
      { id: 'conn-3', source: 'comp-2', target: 'comp-3', protocol: 'PostgreSQL / TCP', description: 'RLS database queries' },
      { id: 'conn-4', source: 'comp-2', target: 'comp-5', protocol: 'S3 API / HTTPS', description: 'File uploads & export' },
      { id: 'conn-5', source: 'comp-2', target: 'comp-6', protocol: 'HTTPS / JSON', description: 'AI generation prompts' },
      { id: 'conn-6', source: 'comp-2', target: 'comp-7', protocol: 'GitHub REST v3', description: 'Repository push & PR' },
      { id: 'conn-7', source: 'comp-2', target: 'comp-8', protocol: 'RESP / TCP', description: 'Cache lookups' },
      { id: 'conn-8', source: 'comp-2', target: 'comp-9', protocol: 'Redis Pub/Sub', description: 'Background queue jobs' },
      { id: 'conn-9', source: 'comp-2', target: 'comp-10', protocol: 'HTTPS / OTLP', description: 'Telemetry & log trace' },
      { id: 'conn-10', source: 'comp-1', target: 'comp-11', protocol: 'HTTPS / Edge', description: 'Edge CDN routing' },
    ];

    const model: FullArchitecture = { project_id: projectId, components, connections };
    await this.saveArchitecture(projectId, components, connections);
    return model;
  }
}
