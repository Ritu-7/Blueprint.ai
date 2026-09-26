export type TemplateKind = 'todo' | 'ecommerce' | 'dashboard' | 'portfolio' | 'chat' | 'crm';

export type ProjectFile = {
  path: string;
  name: string;
  language: 'tsx' | 'ts' | 'css' | 'sql' | 'json' | 'md' | 'js';
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

type WeightedKeyword = { pattern: RegExp; weight: number };

const kindKeywords: Record<TemplateKind, WeightedKeyword[]> = {
  todo: [
    { pattern: /\btodo\b/, weight: 3 },
    { pattern: /\bto-do\b/, weight: 3 },
    { pattern: /\btask\b/, weight: 3 },
    { pattern: /\btasks\b/, weight: 3 },
    { pattern: /\bchecklist\b/, weight: 3 },
    { pattern: /\breminder\b/, weight: 2 },
    { pattern: /\breminders\b/, weight: 2 },
    { pattern: /\btrack(ing|er)?\b/, weight: 1 },
    { pattern: /\bbacklog\b/, weight: 2 },
    { pattern: /\bkanban\b/, weight: 2 },
    { pattern: /\bplanner\b/, weight: 2 },
  ],
  ecommerce: [
    { pattern: /\becommerce\b/, weight: 3 },
    { pattern: /\be-commerce\b/, weight: 3 },
    { pattern: /\bcheckout\b/, weight: 3 },
    { pattern: /\bshopping cart\b/, weight: 3 },
    { pattern: /\bstorefront\b/, weight: 3 },
    { pattern: /\bonline store\b/, weight: 3 },
    { pattern: /\bshop\b/, weight: 2 },
    { pattern: /\bcart\b/, weight: 2 },
    { pattern: /\bsell\b/, weight: 2 },
    { pattern: /\bmerchandi[sz](ing|e)\b/, weight: 2 },
    { pattern: /\bproduct\b/, weight: 1 },
    { pattern: /\bproducts\b/, weight: 1 },
    { pattern: /\bstore\b/, weight: 1 },
    { pattern: /\binventory\b/, weight: 1 },
  ],
  dashboard: [
    { pattern: /\bdashboard\b/, weight: 3 },
    { pattern: /\banalytics\b/, weight: 3 },
    { pattern: /\bkpi\b/, weight: 3 },
    { pattern: /\bkpis\b/, weight: 3 },
    { pattern: /\bmetric\b/, weight: 2 },
    { pattern: /\bmetrics\b/, weight: 2 },
    { pattern: /\bchart\b/, weight: 2 },
    { pattern: /\bcharts\b/, weight: 2 },
    { pattern: /\breport\b/, weight: 2 },
    { pattern: /\breports\b/, weight: 2 },
    { pattern: /\bvisuali[sz](ation|e)\b/, weight: 2 },
    { pattern: /\binsight\b/, weight: 1 },
    { pattern: /\binsights\b/, weight: 1 },
  ],
  portfolio: [
    { pattern: /\bportfolio\b/, weight: 3 },
    { pattern: /\bpersonal site\b/, weight: 3 },
    { pattern: /\bpersonal website\b/, weight: 3 },
    { pattern: /\bresume\b/, weight: 3 },
    { pattern: /\bphotographer\b/, weight: 3 },
    { pattern: /\bdesigner\b/, weight: 2 },
    { pattern: /\bcreator\b/, weight: 2 },
    { pattern: /\bshowcase\b/, weight: 2 },
    { pattern: /\bcase stud(y|ies)\b/, weight: 2 },
    { pattern: /\bfreelance\b/, weight: 2 },
  ],
  chat: [
    { pattern: /\bchat\b/, weight: 3 },
    { pattern: /\bmessaging\b/, weight: 3 },
    { pattern: /\bsupport (chat|widget|bot)\b/, weight: 3 },
    { pattern: /\bconversation\b/, weight: 2 },
    { pattern: /\bconversations\b/, weight: 2 },
    { pattern: /\binbox\b/, weight: 2 },
    { pattern: /\bmessage\b/, weight: 2 },
    { pattern: /\bmessages\b/, weight: 2 },
    { pattern: /\bchatbot\b/, weight: 3 },
    { pattern: /\blive chat\b/, weight: 3 },
    { pattern: /\bthread\b/, weight: 1 },
    { pattern: /\bthreads\b/, weight: 1 },
  ],
  crm: [
    { pattern: /\bcrm\b/, weight: 3 },
    { pattern: /\blead\b/, weight: 3 },
    { pattern: /\bleads\b/, weight: 3 },
    { pattern: /\bpipeline\b/, weight: 2 },
    { pattern: /\bsales\b/, weight: 2 },
    { pattern: /\bdeal\b/, weight: 2 },
    { pattern: /\bdeals\b/, weight: 2 },
    { pattern: /\bcustomer relationship\b/, weight: 3 },
    { pattern: /\bprospect\b/, weight: 2 },
    { pattern: /\bprospects\b/, weight: 2 },
    { pattern: /\bcustomer\b/, weight: 1 },
    { pattern: /\bcustomers\b/, weight: 1 },
  ],
};

export function detectTemplateKind(prompt: string): TemplateKind {
  const text = prompt.toLowerCase();

  const kinds = Object.keys(kindKeywords) as TemplateKind[];
  let bestKind: TemplateKind = 'todo';
  let bestScore = 0;

  for (const kind of kinds) {
    let score = 0;
    for (const { pattern, weight } of kindKeywords[kind]) {
      if (pattern.test(text)) {
        score += weight;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestKind = kind;
    }
  }

  return bestKind;
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

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
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

  const featureComponentName: Record<TemplateKind, string> = {
    todo: 'TaskFilters',
    ecommerce: 'CartSummary',
    dashboard: 'MetricTrend',
    portfolio: 'ContactForm',
    chat: 'MessageComposer',
    crm: 'DealCard',
  };

  const featureComponentContent: Record<TemplateKind, string> = {
    todo: `'use client';

import { Search } from 'lucide-react';

const filters = ['All', 'Active', 'Completed', 'High Priority'];

export function TaskFilters({
  active = 'All',
  onFilter,
}: {
  active?: string;
  onFilter?: (filter: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
        <input
          type="text"
          placeholder="Search tasks…"
          className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.04] pl-9 pr-3 text-sm text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => onFilter?.(f)}
            className={\`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors \${
              active === f
                ? 'bg-cyan-400 text-[#05070a]'
                : 'bg-white/[0.04] text-white/50 hover:text-white'
            }\`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}`,
    ecommerce: `'use client';

import { Sparkles } from 'lucide-react';

export function CartSummary({
  itemCount = 3,
  subtotal = 247.0,
}: {
  itemCount?: number;
  subtotal?: number;
}) {
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shipping;

  return (
    <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/50">
        Cart Summary
      </h2>
      <div className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between text-white/60">
          <span>Items ({itemCount})</span>
          <span>\${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-white/60">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : \`\$\${shipping.toFixed(2)}\`}</span>
        </div>
        <div className="border-t border-white/10 pt-3 flex justify-between font-black text-white">
          <span>Total</span>
          <span>\${total.toFixed(2)}</span>
        </div>
      </div>
      <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-2.5 text-sm font-black text-[#05070a]">
        <Sparkles className="h-4 w-4" />
        Checkout
      </button>
    </aside>
  );
}`,
    dashboard: `'use client';

import { ArrowUpRight } from 'lucide-react';

const dataPoints = [18, 32, 28, 45, 42, 55, 48, 62, 58, 71, 68, 76];
const maxVal = Math.max(...dataPoints);

export function MetricTrend({
  label = 'Revenue',
  value = '$12,482',
  change = '+18.2%',
}: {
  label?: string;
  value?: string;
  change?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{label}</p>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {change}
        </span>
      </div>
      <strong className="mt-2 block text-3xl font-black text-white">{value}</strong>
      <div className="mt-4 flex items-end gap-1 h-16">
        {dataPoints.map((dp, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-cyan-400/30"
            style={{ height: \`\${(dp / maxVal) * 100}%\` }}
          />
        ))}
      </div>
    </div>
  );
}`,
    portfolio: `'use client';

import { ArrowUpRight } from 'lucide-react';

export function ContactForm() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/50">
        Get In Touch
      </h2>
      <p className="mt-2 text-sm text-white/40">
        Interested in working together? Drop me a message.
      </p>
      <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Name"
            className="h-10 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 text-sm text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            className="h-10 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 text-sm text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <textarea
          rows={4}
          placeholder="Tell me about your project…"
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] p-3 text-sm text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none resize-none"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-black text-[#05070a]"
        >
          Send Message
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}`,
    chat: `'use client';

import { ArrowUpRight } from 'lucide-react';

export function MessageComposer({
  onSend,
}: {
  onSend?: (message: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-end gap-3">
        <textarea
          rows={2}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.04] p-3 text-sm text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              if (target.value.trim()) {
                onSend?.(target.value.trim());
                target.value = '';
              }
            }
          }}
        />
        <button
          onClick={() => {}}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-[#05070a]"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2 text-xs text-white/30">
        <span className="rounded bg-white/[0.04] px-2 py-1">Markdown supported</span>
        <span className="rounded bg-white/[0.04] px-2 py-1">Shift+Enter for new line</span>
      </div>
    </div>
  );
}`,
    crm: `'use client';

import { ArrowUpRight } from 'lucide-react';

const stages: Record<string, string> = {
  qualified: 'bg-blue-400/20 text-blue-300',
  proposal: 'bg-amber-400/20 text-amber-300',
  negotiation: 'bg-purple-400/20 text-purple-300',
  'closed won': 'bg-emerald-400/20 text-emerald-300',
};

export function DealCard({
  company = 'Acme Studio',
  contact = 'Jane Cooper',
  value = 24000,
  stage = 'proposal',
  nextStep = 'Follow-up call on Friday',
}: {
  company?: string;
  contact?: string;
  value?: number;
  stage?: string;
  nextStep?: string;
}) {
  const stageStyle = stages[stage] || 'bg-white/[0.06] text-white/50';

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-black text-white">{company}</h3>
          <p className="mt-1 text-xs text-white/40">{contact}</p>
        </div>
        <span className={\`rounded-full px-2.5 py-1 text-xs font-bold capitalize \${stageStyle}\`}>
          {stage}
        </span>
      </div>
      <strong className="mt-3 block text-2xl font-black text-white">
        \${value.toLocaleString()}
      </strong>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.04] p-3">
        <span className="text-xs text-white/50">{nextStep}</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-cyan-400" />
      </div>
    </article>
  );
}`,
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
  const slug = slugify(title);

  const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #05070a;
  color: #ffffff;
}

* {
  box-sizing: border-box;
}`;

  const packageJson = JSON.stringify(
    {
      name: slug || 'blueprint-project',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        next: '^14.2.0',
        react: '^18.3.0',
        'react-dom': '^18.3.0',
        'lucide-react': '^0.400.0',
      },
      devDependencies: {
        typescript: '^5.4.0',
        '@types/node': '^20.0.0',
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
        tailwindcss: '^3.4.0',
        postcss: '^8.4.0',
        autoprefixer: '^10.4.0',
      },
    },
    null,
    2,
  );

  const readme = `# ${title}

${kindLabels[kind]} — generated by Blueprint.ai.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

${api}

## Database Schema

The Supabase schema is in \`supabase/schema.sql\`. Apply it with:

\`\`\`bash
supabase db reset   # or paste into the Supabase SQL editor
\`\`\`

## Project Structure

- \`app/\` — Next.js App Router pages and layouts
- \`components/\` — Reusable UI components
- \`app/api/\` — API route handlers
- \`supabase/\` — Database schema
- \`docs/\` — API documentation
`;

  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cyan accent used throughout the generated components
        accent: '#22d3ee',
        cyan: {
          400: '#22d3ee',
        },
        background: '#05070a',
      },
    },
  },
  plugins: [],
};`;

  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;

  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;`;

  // Generated files use relative imports only (no @/ aliases), so a plain
  // standard Next.js tsconfig is sufficient.
  const tsconfigJson = JSON.stringify(
    {
      compilerOptions: {
        target: 'es5',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: {
          '@/*': ['./*'],
        },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    },
    null,
    2,
  );

  const gitignore = `# dependencies
node_modules

# Next.js build output
.next
out

# local env files
.env*.local
.env.local

# misc
.DS_Store
*.tsbuildinfo
`;

  return [
    { path: 'app/globals.css', name: 'globals.css', language: 'css' as const, content: globalsCss },
    { path: 'app/page.tsx', name: 'page.tsx', language: 'tsx' as const, content: pageCode },
    {
      path: 'app/layout.tsx',
      name: 'layout.tsx',
      language: 'tsx' as const,
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
      language: 'tsx' as const,
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
      path: `components/${featureComponentName[kind]}.tsx`,
      name: `${featureComponentName[kind]}.tsx`,
      language: 'tsx' as const,
      content: featureComponentContent[kind],
    },
    {
      path: `app/api/${kind}/route.ts`,
      name: 'route.ts',
      language: 'ts' as const,
      content: `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true, data: body }, { status: 201 });
}`,
    },
    { path: 'supabase/schema.sql', name: 'schema.sql', language: 'sql' as const, content: schema },
    { path: 'docs/api.md', name: 'api.md', language: 'md' as const, content: api },
    { path: 'package.json', name: 'package.json', language: 'json' as const, content: packageJson },
    { path: 'README.md', name: 'README.md', language: 'md' as const, content: readme },
    { path: 'tailwind.config.js', name: 'tailwind.config.js', language: 'js' as const, content: tailwindConfig },
    { path: 'postcss.config.js', name: 'postcss.config.js', language: 'js' as const, content: postcssConfig },
    { path: 'next.config.js', name: 'next.config.js', language: 'js' as const, content: nextConfig },
    { path: 'tsconfig.json', name: 'tsconfig.json', language: 'json' as const, content: tsconfigJson },
    { path: '.gitignore', name: '.gitignore', language: 'md' as const, content: gitignore },
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
