'use client';

import { useState } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import {
  Terminal, Plus, Trash2, ChevronDown, ChevronRight,
  Copy, CheckCircle2, Lock, Globe, Eye, EyeOff, Play,
  RefreshCw, Code2, FileJson, Hash,
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { cn } from '@/utils/utils';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ParamIn = 'query' | 'path' | 'header' | 'body';

interface ApiParam {
  name: string;
  in: ParamIn;
  type: string;
  required: boolean;
  description: string;
  example: string;
}

interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  authenticated: boolean;
  tags: string[];
  params: ApiParam[];
  requestBody?: string;
  responseExample: string;
  statusCodes: { code: number; description: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:    'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
  POST:   'text-cyan-400   bg-cyan-950/40    border-cyan-500/30',
  PUT:    'text-amber-400  bg-amber-950/30   border-amber-500/30',
  PATCH:  'text-purple-400 bg-purple-950/30  border-purple-500/30',
  DELETE: 'text-red-400    bg-red-950/30     border-red-500/30',
};

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span className={cn('inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-black uppercase', METHOD_COLORS[method])}>
      {method}
    </span>
  );
}

/** Derives API endpoints from the project's blueprint api_code or generates sensible defaults. */
function deriveEndpoints(project: { name?: string | null; api_code?: string | null } | null): ApiEndpoint[] {
  if (!project) return [];

  const base = project.name?.toLowerCase().replace(/\s+/g, '-') || 'items';

  return [
    {
      id: '1',
      method: 'GET',
      path: `/api/${base}`,
      summary: `List ${project.name} items`,
      description: `Returns a paginated list of all ${project.name} resources. Supports filtering, sorting, and pagination via query parameters.`,
      authenticated: true,
      tags: ['Core'],
      params: [
        { name: 'page', in: 'query', type: 'integer', required: false, description: 'Page number (1-indexed)', example: '1' },
        { name: 'limit', in: 'query', type: 'integer', required: false, description: 'Items per page', example: '20' },
        { name: 'sort', in: 'query', type: 'string', required: false, description: 'Sort field', example: 'created_at' },
      ],
      responseExample: JSON.stringify({ success: true, data: [], meta: { page: 1, total: 0 } }, null, 2),
      statusCodes: [
        { code: 200, description: 'Successful response with items list' },
        { code: 401, description: 'Unauthorized — missing or invalid token' },
        { code: 500, description: 'Internal server error' },
      ],
    },
    {
      id: '2',
      method: 'POST',
      path: `/api/${base}`,
      summary: `Create ${project.name} item`,
      description: `Creates a new resource. All required fields must be provided in the request body as JSON.`,
      authenticated: true,
      tags: ['Core'],
      params: [],
      requestBody: JSON.stringify({ name: 'string', description: 'string' }, null, 2),
      responseExample: JSON.stringify({ success: true, data: { id: 'uuid', name: 'Example', created_at: new Date().toISOString() } }, null, 2),
      statusCodes: [
        { code: 201, description: 'Resource created successfully' },
        { code: 400, description: 'Validation error — check request body' },
        { code: 401, description: 'Unauthorized' },
      ],
    },
    {
      id: '3',
      method: 'GET',
      path: `/api/${base}/:id`,
      summary: `Get ${project.name} by ID`,
      description: `Returns a single resource by its UUID. Returns 404 if not found or if the authenticated user does not have access.`,
      authenticated: true,
      tags: ['Core'],
      params: [
        { name: 'id', in: 'path', type: 'uuid', required: true, description: 'Resource UUID', example: '550e8400-e29b-41d4-a716-446655440000' },
      ],
      responseExample: JSON.stringify({ success: true, data: { id: 'uuid', name: 'Example' } }, null, 2),
      statusCodes: [
        { code: 200, description: 'Resource found' },
        { code: 404, description: 'Resource not found or access denied' },
        { code: 401, description: 'Unauthorized' },
      ],
    },
    {
      id: '4',
      method: 'PATCH',
      path: `/api/${base}/:id`,
      summary: `Update ${project.name}`,
      description: `Partially updates an existing resource. Only provided fields are updated. Enforces ownership via Row Level Security.`,
      authenticated: true,
      tags: ['Core'],
      params: [
        { name: 'id', in: 'path', type: 'uuid', required: true, description: 'Resource UUID', example: '550e8400-e29b-41d4-a716-446655440000' },
      ],
      requestBody: JSON.stringify({ name: 'string (optional)', description: 'string (optional)' }, null, 2),
      responseExample: JSON.stringify({ success: true, data: { id: 'uuid', name: 'Updated Name', updated_at: new Date().toISOString() } }, null, 2),
      statusCodes: [
        { code: 200, description: 'Resource updated' },
        { code: 400, description: 'Validation error' },
        { code: 404, description: 'Resource not found' },
      ],
    },
    {
      id: '5',
      method: 'DELETE',
      path: `/api/${base}/:id`,
      summary: `Delete ${project.name}`,
      description: `Soft-deletes a resource by setting deleted_at timestamp. Data is retained for audit purposes. Hard-delete requires admin privileges.`,
      authenticated: true,
      tags: ['Core'],
      params: [
        { name: 'id', in: 'path', type: 'uuid', required: true, description: 'Resource UUID', example: '550e8400-e29b-41d4-a716-446655440000' },
      ],
      responseExample: JSON.stringify({ success: true, message: 'Resource deleted successfully' }, null, 2),
      statusCodes: [
        { code: 200, description: 'Resource deleted' },
        { code: 404, description: 'Resource not found' },
        { code: 401, description: 'Unauthorized' },
      ],
    },
    {
      id: '6',
      method: 'GET',
      path: '/api/health',
      summary: 'Health check',
      description: 'Returns service health status and version information. No authentication required.',
      authenticated: false,
      tags: ['System'],
      params: [],
      responseExample: JSON.stringify({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() }, null, 2),
      statusCodes: [
        { code: 200, description: 'Service is healthy' },
        { code: 503, description: 'Service unavailable' },
      ],
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint Detail Panel
// ─────────────────────────────────────────────────────────────────────────────

function EndpointDetail({ endpoint }: { endpoint: ApiEndpoint }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'params' | 'body' | 'response'>('overview');
  const [copied, setCopied] = useState(false);

  const copyResponse = () => {
    navigator.clipboard.writeText(endpoint.responseExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Copied to clipboard');
  };

  const statusColor = (code: number) => {
    if (code < 300) return 'text-emerald-400';
    if (code < 400) return 'text-amber-400';
    if (code < 500) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Path + Auth */}
      <div className="flex items-center gap-3 flex-wrap">
        <MethodBadge method={endpoint.method} />
        <span className="font-mono text-sm text-white bg-white/5 border border-white/10 rounded px-3 py-1">{endpoint.path}</span>
        {endpoint.authenticated ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 border border-amber-500/30 bg-amber-950/20 rounded px-2 py-0.5">
            <Lock className="h-2.5 w-2.5" /> Auth Required
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 bg-emerald-950/20 rounded px-2 py-0.5">
            <Globe className="h-2.5 w-2.5" /> Public
          </span>
        )}
        {endpoint.tags.map((t) => (
          <span key={t} className="text-[10px] font-bold text-white/40 border border-white/10 rounded px-2 py-0.5 bg-white/5">{t}</span>
        ))}
      </div>

      <p className="text-sm text-white/60 leading-relaxed">{endpoint.description}</p>

      {/* Detail Tabs */}
      <div className="flex items-center gap-1 border-b border-white/10 pb-0">
        {(['overview', 'params', 'body', 'response'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-2 text-xs font-medium capitalize rounded-t transition',
              activeTab === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
            )}
          >
            {tab === 'body' ? 'Request Body' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {endpoint.statusCodes.map((s) => (
            <div key={s.code} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <p className={cn('font-mono font-black text-sm', statusColor(s.code))}>{s.code}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'params' && (
        <div className="space-y-2">
          {endpoint.params.length === 0 ? (
            <p className="text-xs text-white/30 py-4">No parameters defined for this endpoint.</p>
          ) : (
            endpoint.params.map((p) => (
              <div key={p.name} className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-cyan-200">{p.name}</span>
                    <span className="text-[10px] font-bold text-white/30 border border-white/10 rounded px-1.5 py-0.5">{p.in}</span>
                    <span className="text-[10px] font-bold text-purple-300 border border-purple-500/20 rounded px-1.5 py-0.5 bg-purple-950/20">{p.type}</span>
                    {p.required && <span className="text-[10px] font-bold text-red-400">required</span>}
                  </div>
                  <p className="text-xs text-white/50 mt-1">{p.description}</p>
                </div>
                <span className="font-mono text-[11px] text-white/30 shrink-0">e.g. {p.example}</span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'body' && (
        <div>
          {endpoint.requestBody ? (
            <pre className="rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-cyan-100/80 overflow-auto">
              {endpoint.requestBody}
            </pre>
          ) : (
            <p className="text-xs text-white/30 py-4">This endpoint does not accept a request body.</p>
          )}
        </div>
      )}

      {activeTab === 'response' && (
        <div className="relative">
          <pre className="rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-emerald-100/80 overflow-auto">
            {endpoint.responseExample}
          </pre>
          <button
            onClick={copyResponse}
            className="absolute top-3 right-3 rounded-lg border border-white/10 bg-white/10 p-1.5 text-white/50 hover:text-white transition"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectApisPage() {
  const { project } = useProject();
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(() => deriveEndpoints(project));
  const [selectedId, setSelectedId] = useState<string | null>(endpoints[0]?.id ?? null);
  const [filter, setFilter] = useState<HttpMethod | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [exportVisible, setExportVisible] = useState(false);

  const selected = endpoints.find((e) => e.id === selectedId) ?? null;

  const filtered = endpoints.filter((e) => {
    const matchMethod = filter === 'ALL' || e.method === filter;
    const matchSearch = !search || e.path.toLowerCase().includes(search.toLowerCase()) || e.summary.toLowerCase().includes(search.toLowerCase());
    return matchMethod && matchSearch;
  });

  const addEndpoint = () => {
    const newEp: ApiEndpoint = {
      id: Date.now().toString(),
      method: 'GET',
      path: '/api/new-endpoint',
      summary: 'New Endpoint',
      description: 'Describe this endpoint.',
      authenticated: true,
      tags: [],
      params: [],
      responseExample: JSON.stringify({ success: true, data: {} }, null, 2),
      statusCodes: [
        { code: 200, description: 'Success' },
        { code: 401, description: 'Unauthorized' },
      ],
    };
    setEndpoints((prev) => [...prev, newEp]);
    setSelectedId(newEp.id);
    toast.success('New endpoint added');
  };

  const deleteEndpoint = (id: string) => {
    setEndpoints((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(endpoints.find((e) => e.id !== id)?.id ?? null);
    toast.success('Endpoint removed');
  };

  const openApiSpec = {
    openapi: '3.0.0',
    info: { title: project?.name || 'API', version: '1.0.0' },
    paths: Object.fromEntries(
      endpoints.map((e) => [
        e.path,
        {
          [e.method.toLowerCase()]: {
            summary: e.summary,
            security: e.authenticated ? [{ bearerAuth: [] }] : [],
            responses: Object.fromEntries(e.statusCodes.map((s) => [s.code, { description: s.description }])),
          },
        },
      ])
    ),
  };

  return (
    <div className="min-h-screen bg-[#05070a]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#090c12] px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
              <Terminal className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">API Designer</h1>
              <p className="text-xs text-white/40">{endpoints.length} endpoints · {project?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Hash className="h-3.5 w-3.5" />
              <span>{endpoints.length} total</span>
            </div>
            <button
              onClick={() => { setExportVisible(true); navigator.clipboard.writeText(JSON.stringify(openApiSpec, null, 2)); toast.success('OpenAPI spec copied!'); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition"
            >
              <FileJson className="h-3.5 w-3.5" /> Export OpenAPI
            </button>
            <button
              onClick={addEndpoint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-black text-black hover:bg-cyan-300 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Add Endpoint
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <input
            type="text"
            placeholder="Search endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none w-48"
          />
          {(['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase border transition',
                filter === m
                  ? m === 'ALL' ? 'bg-white/10 border-white/20 text-white' : cn(METHOD_COLORS[m as HttpMethod])
                  : 'border-transparent text-white/30 hover:text-white/60'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex h-[calc(100vh-180px)] overflow-hidden">
        {/* Left: Endpoint List */}
        <div className="w-72 shrink-0 border-r border-white/10 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-xs text-white/30">No endpoints match your filter.</div>
          )}
          {filtered.map((ep) => (
            <div
              key={ep.id}
              onClick={() => setSelectedId(ep.id)}
              className={cn(
                'group flex items-center gap-3 border-b border-white/5 px-4 py-3 cursor-pointer transition',
                selectedId === ep.id ? 'bg-cyan-400/5 border-l-2 border-l-cyan-400' : 'hover:bg-white/5 border-l-2 border-l-transparent'
              )}
            >
              <MethodBadge method={ep.method} />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-white truncate">{ep.path}</p>
                <p className="text-[11px] text-white/40 truncate mt-0.5">{ep.summary}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteEndpoint(ep.id); }}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Right: Endpoint Detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {selected ? (
            <EndpointDetail endpoint={selected} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-xs text-white/30">
              <Terminal className="h-10 w-10 mb-3 text-white/20" />
              <p>Select an endpoint to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
