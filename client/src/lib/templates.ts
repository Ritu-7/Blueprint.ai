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

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Dynamic Prompt Domain Analyzer ───
interface DomainItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  detail: string;
  metric: string;
}

function analyzePromptDomain(prompt: string, title: string) {
  const p = prompt.toLowerCase();

  let domainName = 'Custom App';
  let categories: string[] = ['All', 'Featured', 'Active', 'Archived'];
  let items: DomainItem[] = [];

  if (p.includes('real estate') || p.includes('property') || p.includes('house') || p.includes('rental') || p.includes('home')) {
    domainName = 'Real Estate';
    categories = ['All', 'Villas', 'Penthouses', 'Apartments', 'Estates'];
    items = [
      { id: '1', title: 'Oceanview Luxury Villa', subtitle: 'Miami Beach, FL', category: 'Villas', badge: '$1,250,000', detail: '4 Beds • 3 Baths • 3,400 sqft', metric: '4.9 ★' },
      { id: '2', title: 'Modern Skyline Penthouse', subtitle: 'New York, NY', category: 'Penthouses', badge: '$2,100,000', detail: '3 Beds • 2.5 Baths • 2,800 sqft', metric: '4.8 ★' },
      { id: '3', title: 'Suburban Family Estate', subtitle: 'Austin, TX', category: 'Estates', badge: '$680,000', detail: '4 Beds • 3 Baths • 2,900 sqft', metric: '5.0 ★' },
      { id: '4', title: 'Downtown Glass Loft', subtitle: 'Chicago, IL', category: 'Apartments', badge: '$540,000', detail: '2 Beds • 2 Baths • 1,600 sqft', metric: '4.7 ★' },
    ];
  } else if (p.includes('recipe') || p.includes('food') || p.includes('cooking') || p.includes('meal') || p.includes('restaurant')) {
    domainName = 'Culinary';
    categories = ['All', 'Healthy', 'Italian', 'Quick Meals', 'Desserts'];
    items = [
      { id: '1', title: 'Avocado & Salmon Poke Bowl', subtitle: 'Fresh Pacific salmon, quinoa, avocado', category: 'Healthy', badge: '15 min', detail: '420 kcal • High Protein', metric: '4.9 ★' },
      { id: '2', title: 'Truffle Mushroom Cream Pasta', subtitle: 'Handmade fettuccine with wild truffle', category: 'Italian', badge: '25 min', detail: '680 kcal • Vegetarian', metric: '4.8 ★' },
      { id: '3', title: 'Matcha Chia Seed Pudding', subtitle: 'Organic green tea, chia, almond milk', category: 'Desserts', badge: '10 min', detail: '210 kcal • Vegan', metric: '4.7 ★' },
    ];
  } else if (p.includes('health') || p.includes('doctor') || p.includes('medical') || p.includes('patient') || p.includes('clinic')) {
    domainName = 'Healthcare';
    categories = ['All', 'Cardiology', 'Neurology', 'Pediatrics', 'Dermatology'];
    items = [
      { id: '1', title: 'Dr. Sarah Jenkins', subtitle: 'Chief of Cardiology', category: 'Cardiology', badge: 'Available Today', detail: '14+ Yrs Exp • 4.9 Rating', metric: '2:30 PM' },
      { id: '2', title: 'Dr. Michael Chen', subtitle: 'Neurology Specialist', category: 'Neurology', badge: 'Available Tomorrow', detail: '10+ Yrs Exp • 4.8 Rating', metric: '10:00 AM' },
      { id: '3', title: 'Dr. Elena Rostova', subtitle: 'Pediatric Care Lead', category: 'Pediatrics', badge: 'Available Thu', detail: '12+ Yrs Exp • 5.0 Rating', metric: '11:15 AM' },
    ];
  } else if (p.includes('fitness') || p.includes('gym') || p.includes('workout') || p.includes('exercise')) {
    domainName = 'Fitness';
    categories = ['All', 'HIIT', 'Strength', 'Cardio', 'Flexibility'];
    items = [
      { id: '1', title: 'Full Body HIIT Burn', subtitle: 'High intensity interval training', category: 'HIIT', badge: '45 mins', detail: '520 kcal • 8 Exercises', metric: 'High' },
      { id: '2', title: 'Core & Stability Session', subtitle: 'Abs, obliques, and lower back strength', category: 'Strength', badge: '30 mins', detail: '280 kcal • 6 Exercises', metric: 'Medium' },
      { id: '3', title: 'Power Lifting Routine', subtitle: 'Squat, bench press, deadlift focus', category: 'Strength', badge: '60 mins', detail: '640 kcal • 5 Exercises', metric: 'High' },
    ];
  } else if (p.includes('crypto') || p.includes('finance') || p.includes('wallet') || p.includes('stock') || p.includes('trading')) {
    domainName = 'Finance';
    categories = ['All', 'Layer 1', 'DeFi', 'NFTs', 'Staking'];
    items = [
      { id: '1', title: 'Ethereum (ETH)', subtitle: 'Smart contract platform', category: 'Layer 1', badge: '$3,480.20', detail: 'Volume: $18.4B • Staked: 28%', metric: '+4.2%' },
      { id: '2', title: 'Bitcoin (BTC)', subtitle: 'Digital store of value', category: 'Layer 1', badge: '$64,250.00', detail: 'Volume: $42.1B • Market Cap: $1.2T', metric: '+2.8%' },
      { id: '3', title: 'Solana (SOL)', subtitle: 'High throughput blockchain', category: 'Layer 1', badge: '$148.50', detail: 'Volume: $4.2B • TPS: 2,400', metric: '-1.1%' },
    ];
  } else if (p.includes('job') || p.includes('career') || p.includes('hiring') || p.includes('recruit')) {
    domainName = 'Job Network';
    categories = ['All', 'Engineering', 'Design', 'Product', 'DevOps'];
    items = [
      { id: '1', title: 'Senior Full-Stack Engineer', subtitle: 'Vercel Labs • San Francisco, CA', category: 'Engineering', badge: '$160k - $200k', detail: 'Next.js, TypeScript, PostgreSQL', metric: 'Remote' },
      { id: '2', title: 'AI Product Designer', subtitle: 'OpenAI • San Francisco, CA', category: 'Design', badge: '$150k - $190k', detail: 'Figma, Design Systems, Prototyping', metric: 'Hybrid' },
      { id: '3', title: 'Lead DevOps Specialist', subtitle: 'Stripe • New York, NY', category: 'DevOps', badge: '$175k - $210k', detail: 'Kubernetes, AWS, Terraform', metric: 'Remote' },
    ];
  } else {
    // General Dynamic App
    domainName = title;
    categories = ['All', 'Active', 'High Priority', 'Completed'];
    items = [
      { id: '1', title: `${title} Primary Module`, subtitle: `Configured workflow for ${prompt.slice(0, 40)}`, category: 'Active', badge: 'High Priority', detail: 'Automated workflow engine enabled', metric: 'Active' },
      { id: '2', title: 'Data Surface & Analytics', subtitle: 'Real-time telemetry and reporting channel', category: 'Active', badge: 'Operational', detail: 'Latency: 24ms • 99.9% Uptime', metric: 'Live' },
      { id: '3', title: 'Integration Service', subtitle: 'External REST & GraphQL API connectors', category: 'High Priority', badge: 'Connected', detail: 'Synced with Supabase & PostgreSQL', metric: 'Ready' },
    ];
  }

  const slug = slugify(title);

  // Generate dynamic app/page.tsx
  const pageCode = `'use client';

import { useState, useMemo } from 'react';
import { Search, Sparkles, Plus, ArrowUpRight, Check, Trash2, Filter, Star, Shield, Activity } from 'lucide-react';

const initialItems = ${JSON.stringify(items, null, 2)};
const categories = ${JSON.stringify(categories, null, 2)};

export default function Page() {
  const [items, setItems] = useState(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(categories[1] || 'General');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, activeCategory]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem = {
      id: String(Date.now()),
      title: newItemTitle.trim(),
      subtitle: 'Newly created ${domainName} record',
      category: newItemCategory,
      badge: 'New',
      detail: 'Custom record generated in real time',
      metric: 'Active',
    };

    setItems([newItem, ...items]);
    setNewItemTitle('');
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#05070a] p-4 md:p-8 text-white font-sans">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header Hero Banner */}
        <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 shadow-2xl backdrop-blur-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-200">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              ${domainName} Platform
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-[#05070a] shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:bg-cyan-300 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add Record
            </button>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">${title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            Tailored ${domainName.toLowerCase()} application tailored for your prompt. Filter records, search data, and manage entries live.
          </p>

          {/* Metric Stats Cards */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-cyan-400/20 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Total Records</p>
              <strong className="mt-1 block text-2xl font-black text-white">{items.length}</strong>
            </div>
            <div className="rounded-xl border border-cyan-400/20 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Matching Search</p>
              <strong className="mt-1 block text-2xl font-black text-cyan-300">{filteredItems.length}</strong>
            </div>
            <div className="rounded-xl border border-cyan-400/20 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">System Status</p>
              <strong className="mt-1 block text-2xl font-black text-emerald-400">Operational</strong>
            </div>
          </div>
        </header>

        {/* Search & Category Filter Controls */}
        <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search ${title.toLowerCase()}..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={\`rounded-lg px-3 py-1.5 text-xs font-bold transition-all \${
                  activeCategory === cat
                    ? 'bg-cyan-400 text-[#05070a] shadow-[0_0_12px_rgba(0,243,255,0.2)]'
                    : 'bg-white/[0.04] text-white/50 hover:bg-white/10 hover:text-white'
                }\`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Dynamic Records Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-200 hover:border-cyan-400/40 hover:bg-white/[0.045] shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      {item.category}
                    </span>
                    <h3 className="mt-2 text-lg font-black text-white">{item.title}</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
                    {item.badge}
                  </span>
                </div>

                <p className="mt-2 text-xs text-white/50">{item.subtitle}</p>
                <div className="mt-4 rounded-xl bg-black/40 p-3 text-xs font-mono text-white/70">
                  {item.detail}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-xs font-bold text-cyan-400">{item.metric}</span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                  title="Remove Item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-white/10 py-12 text-center text-white/40">
              <p className="text-sm font-bold">No records match your search query.</p>
              <button
                onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}
                className="mt-2 text-xs font-bold text-cyan-400 hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0d14] p-6 text-white shadow-2xl">
            <h3 className="text-lg font-black">Add New ${domainName} Record</h3>
            <form onSubmit={handleAddItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Record title..."
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/60 mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#151a26] p-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-black hover:bg-cyan-300"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
`;

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
      name: slug || 'blueprint-app',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        next: '^14.2.0',
        react: '^18.3.0',
        'react-dom': '^18.3.0',
        'lucide-react': '^0.400.0',
      },
    },
    null,
    2
  );

  const schema = `CREATE TABLE ${slug.replace(/-/g, '_')}_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

  const api = `GET    /api/${slug}    List records
POST   /api/${slug}    Create new record`;

  const files: ProjectFile[] = [
    { path: 'app/globals.css', name: 'globals.css', language: 'css', content: globalsCss },
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
    { path: 'supabase/schema.sql', name: 'schema.sql', language: 'sql', content: schema },
    { path: 'package.json', name: 'package.json', language: 'json', content: packageJson },
  ];

  return { title, domainName, schema, api, files };
}

function previewFor(kind: TemplateKind, title: string) {
  return `<main class="min-h-full bg-[#05070a] p-6 text-white">
  <section class="mx-auto max-w-6xl space-y-6">
    <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
      <p class="mb-3 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">AI Application Preview</p>       
      <h1 class="text-4xl font-black tracking-tight">${title}</h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-white/55">Generated interactive full-stack workspace with dynamic data surfaces.</p>
    </div>
  </section>
</main>`;
}

export function generateProjectFromPrompt(prompt: string): GeneratedProject {
  const kind = detectTemplateKind(prompt);
  const name = titleFromPrompt(prompt, kind);
  const domain = analyzePromptDomain(prompt, name);

  const uiCode = domain.files
    .filter((file) => file.language === 'tsx' || file.language === 'ts')
    .map((file) => `// ${file.path}\n${file.content}`)
    .join('\n\n');

  return {
    name,
    kind,
    description: `Full-stack ${name} application generated specifically for: "${prompt}".`,
    preview: previewFor(kind, name),
    uiCode,
    schema: domain.schema,
    api: domain.api,
    files: domain.files,
  };
}
