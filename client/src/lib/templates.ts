export type TemplateKind = 'todo' | 'ecommerce' | 'dashboard' | 'portfolio' | 'chat' | 'crm';

export type ProjectFile = {
  path: string;
  name: string;
  language: 'tsx' | 'ts' | 'sql' | 'json' | 'md';
  content: string;
};

export type GeneratedProject = {
  id?: string;
  name: string;
  description: string;
  kind: TemplateKind;
  preview: string;
  uiCode: string;
  schema: string;
  api: string;
  files: ProjectFile[];
};

const kindLabels: Record<TemplateKind, string> = {
  todo: 'TaskFlow OS',
  ecommerce: 'Commerce Grid',
  dashboard: 'MetricOps Dashboard',
  portfolio: 'Signal Portfolio',
  chat: 'Relay Chat',
  crm: 'Pipeline CRM',
};

export function detectTemplateKind(prompt: string): TemplateKind {
  const text = prompt.toLowerCase();

  if (/(shop|store|commerce|ecommerce|product|cart|checkout)/.test(text)) return 'ecommerce';
  if (/(dashboard|analytics|metric|chart|report|kpi)/.test(text)) return 'dashboard';
  if (/(portfolio|personal site|resume|creator|designer|photographer)/.test(text)) return 'portfolio';
  if (/(chat|message|messaging|inbox|conversation|support bot)/.test(text)) return 'chat';
  if (/(crm|lead|customer|pipeline|sales|deal)/.test(text)) return 'crm';
  return 'todo';
}

function titleFromPrompt(prompt: string, kind: TemplateKind) {
  const cleaned = prompt
    .replace(/^(create|build|make|generate)\s+(an?\s+)?/i, '')
    .trim()
    .replace(/[^\w\s-]/g, '');

  if (!cleaned || cleaned.length < 4) return kindLabels[kind];

  return cleaned
    .split(/\s+/)
    .slice(0, 5)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const pageShell = (title: string, body: string) => `'use client';

import { Activity, ArrowUpRight, Plus, Search, Sparkles } from 'lucide-react';

const stats = [
  { label: 'Automations', value: '18' },
  { label: 'Conversion', value: '94%' },
  { label: 'Latency', value: '24ms' },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#05070a] p-6 text-white">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              AI Generated
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-[#05070a]">
              Launch
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <h1 className="text-4xl font-black tracking-tight">${title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            Generated production-ready interface with responsive layouts, data surfaces, and workflow actions.  
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-cyan-400/15 bg-white/[0.035] p-5">   
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">{stat.label}</p>       
              <strong className="mt-3 block text-3xl font-black">{stat.value}</strong>
            </article>
          ))}
        </div>

${body}
      </section>
    </main>
  );
}`;

function schemaFor(kind: TemplateKind) {
  const schemas: Record<TemplateKind, string> = {
    todo: `CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX todos_completed_idx ON todos (completed);
CREATE INDEX todos_due_date_idx ON todos (due_date);`,
    ecommerce: `CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  inventory INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1
);`,
    dashboard: `CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  value NUMERIC NOT NULL,
  change_percent NUMERIC NOT NULL DEFAULT 0,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);`,
    portfolio: `CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client TEXT,
  summary TEXT NOT NULL,
  role TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  published_at DATE
);

CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    chat: `CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    crm: `CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  stage TEXT NOT NULL DEFAULT 'qualified',
  deal_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  next_step TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX leads_stage_idx ON leads (stage);`,
  };

  return schemas[kind];
}

function apiFor(kind: TemplateKind) {
  const resource: Record<TemplateKind, string> = {
    todo: 'todos',
    ecommerce: 'products',
    dashboard: 'metrics',
    portfolio: 'projects',
    chat: 'messages',
    crm: 'leads',
  };

  const item = resource[kind].replace(/s$/, '');

  return `GET    /api/${resource[kind]}          List ${resource[kind]}
POST   /api/${resource[kind]}          Create ${item}
GET    /api/${resource[kind]}/:id      Fetch ${item} by id
PATCH  /api/${resource[kind]}/:id      Update ${item}
DELETE /api/${resource[kind]}/:id      Delete ${item}

Response shape:
{
  "success": true,
  "data": {},
  "meta": { "generatedBy": "Blueprint.ai" }
}`;
}

function filesFor(kind: TemplateKind, title: string, schema: string, api: string): ProjectFile[] {
  const componentName: Record<TemplateKind, string> = {
    todo: 'TodoList',
    ecommerce: 'ProductGrid',
    dashboard: 'AnalyticsPanel',
    portfolio: 'ProjectShowcase',
    chat: 'ConversationView',
    crm: 'PipelineBoard',
  };

  const featureBody: Record<TemplateKind, string> = {
    todo: `        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/50">Today</h2>
            <button className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-black text-[#05070a]"><Plus className="h-4 w-4" /> Task</button>
          </div>
          {['Finalize launch copy', 'Review Supabase schema', 'Ship preview mode'].map((task) => (
            <div key={task} className="mb-3 rounded-xl border border-white/5 bg-white/[0.035] p-4 text-sm text-white/70">{task}</div>
          ))}
        </section>`,
    ecommerce: `        <section className="grid gap-4 md:grid-cols-3">
          {['Aero Keyboard', 'Glass Dock', 'Neon Headset'].map((product) => (
            <article key={product} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-4 aspect-square rounded-xl bg-cyan-400/10" />
              <h2 className="font-black">{product}</h2>
              <p className="mt-2 text-sm text-white/45">Premium generated catalog card.</p>
            </article>
          ))}
        </section>`,
    dashboard: `        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2 text-cyan-300"><Activity className="h-4 w-4" /> Live revenue stream</div>
          <div className="grid h-64 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/10 text-sm text-white/55">Chart canvas ready for Recharts data</div>
        </section>`,
    portfolio: `        <section className="grid gap-4 md:grid-cols-2">
          {['Brand system', 'AI product suite', 'Editorial platform'].map((project) => (
            <article key={project} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Case Study</p>
              <h2 className="mt-3 text-2xl font-black">{project}</h2>
            </article>
          ))}
        </section>`,
    chat: `        <section className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">{['Launch team', 'Support queue', 'Design partners'].map((chat) => <div key={chat} className="mb-2 rounded-xl bg-white/[0.04] p-3 text-sm">{chat}</div>)}</aside>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="rounded-xl bg-cyan-400/10 p-4 text-sm text-cyan-100">AI assistant drafted a reply with project context.</div></div>
        </section>`,
    crm: `        <section className="grid gap-4 md:grid-cols-3">
          {['Qualified', 'Proposal', 'Closed Won'].map((stage) => (
            <div key={stage} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{stage}</h2>
              <div className="mt-4 rounded-xl bg-white/[0.04] p-4 text-sm text-white/70">Acme Studio - $24,000</div>
            </div>
          ))}
        </section>`,
  };

  const pageCode = pageShell(title, featureBody[kind]);

  return [
    { path: 'app/page.tsx', name: 'page.tsx', language: 'tsx', content: pageCode },
    {
      path: 'app/layout.tsx',
      name: 'layout.tsx',
      language: 'tsx',
      content: `import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
    },
    {
      path: `components/${componentName[kind]}.tsx`,
      name: `${componentName[kind]}.tsx`,
      language: 'tsx',
      content: `export function ${componentName[kind]}() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-xl font-black">${title}</h2>
      <p className="mt-2 text-sm text-white/50">Reusable generated feature component.</p>
    </section>
  );
}`,
    },
    {
      path: `app/api/${kind}/route.ts`,
      name: 'route.ts',
      language: 'ts',
      content: `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true, data: body }, { status: 201 });
}`,
    },
    { path: 'supabase/schema.sql', name: 'schema.sql', language: 'sql', content: schema },
    { path: 'docs/api.md', name: 'api.md', language: 'md', content: api },
  ];
}

function previewFor(kind: TemplateKind, title: string) {
  const caption: Record<TemplateKind, string> = {
    todo: 'Prioritize tasks, automate follow-ups, and keep shipping velocity visible.',
    ecommerce: 'A conversion-ready storefront with product cards, cart logic, and merchandising blocks.',       
    dashboard: 'Operational analytics with KPI cards, report queues, and executive visibility.',
    portfolio: 'A polished creative portfolio with case studies, inquiry capture, and positioning.',
    chat: 'A collaborative messaging workspace with teams, threads, and AI-assisted replies.',
    crm: 'A sales command center with pipeline stages, lead intelligence, and next actions.',
  };

  return `<main class="min-h-full bg-[#05070a] p-6 text-white">
  <section class="mx-auto max-w-6xl space-y-6">
    <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
      <p class="mb-3 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">AI Website Preview</p>       
      <h1 class="text-4xl font-black tracking-tight">${title}</h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-white/55">${caption[kind]}</p>
    </div>
  </section>
</main>`;
}

export function generateProjectFromPrompt(prompt: string): GeneratedProject {
  const kind = detectTemplateKind(prompt);
  const name = titleFromPrompt(prompt, kind);
  const schema = schemaFor(kind);
  const api = apiFor(kind);
  const files = filesFor(kind, name, schema, api);
  const uiCode = files
    .filter((file) => file.language === 'tsx' || file.language === 'ts')
    .map((file) => `// ${file.path}\n${file.content}`)
    .join('\n\n');

  return {
    name,
    kind,
    description: `${kindLabels[kind]} generated from your prompt with files, schema, API docs, and live preview.`,
    preview: previewFor(kind, name),
    uiCode,
    schema,
    api,
    files,
  };
}
