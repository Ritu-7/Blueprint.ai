import { Link } from 'react-router-dom';
import { ArrowRight, Bot, CheckCircle2, Code2, Database, Globe2, Play, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';

const prompts = [
  'Build a CRM for a boutique agency',
  'Create an ecommerce site for desk gear',
  'Generate a dashboard for SaaS metrics',
  'Make a portfolio for a creative developer',
];

const features = [
  { icon: Bot, title: 'AI Architect', body: 'Prompt-to-project generation with files, schema, routes, and preview state.' },
  { icon: Code2, title: 'IDE Workspace', body: 'Explore generated folders, inspect code, copy files, and iterate like Cursor.' },
  { icon: Database, title: 'Backend Ready', body: 'Supabase-friendly SQL and API contracts generated with every app.' },
  { icon: Globe2, title: 'Live Preview', body: 'Rendered website previews with responsive device controls and polished UI.' },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070a]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_50%_0%,rgba(0,243,255,0.18),transparent_58%)]" />

      <section className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-200"
          >
            <Sparkles className="h-4 w-4" />
            AI Website Builder + IDE
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl"
          >
            Build Full Stack Apps with AI
          </motion.h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/58">
            Blueprint.ai turns a prompt into a polished app workspace: live preview, generated files, database schema, API docs, and a premium code editor experience.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex min-h-14 flex-1 items-center rounded-xl bg-black/30 px-4 text-sm text-white/45">
                Create a conversion-ready SaaS dashboard with auth and analytics...
              </div>
              <Link href="/builder" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#05070a] transition hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(0,243,255,0.35)]">
                Start Building
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <Link key={prompt} href="/builder" className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-white/45 transition hover:border-cyan-400/30 hover:text-white">
                {prompt}
              </Link>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
          <div className="rounded-2xl border border-white/10 bg-[#070a0f]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex gap-2"><span className="h-3 w-3 rounded-full bg-rose-400" /><span className="h-3 w-3 rounded-full bg-yellow-300" /><span className="h-3 w-3 rounded-full bg-green-400" /></div>
              <div className="rounded-lg bg-black/40 px-4 py-1 text-xs text-white/35">preview.blueprint.ai</div>
              <Play className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="grid gap-4 p-5">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] p-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Generated App</p>
                <h2 className="mt-4 text-3xl font-black text-white">Pipeline CRM</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['$284K', '47', '92%'].map((stat) => <div key={stat} className="rounded-xl bg-white/[0.04] p-4 text-xl font-black text-white">{stat}</div>)}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {['Qualified', 'Proposal', 'Closed'].map((stage) => <div key={stage} className="h-28 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs font-bold uppercase tracking-widest text-white/35">{stage}</div>)}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <GlassCard key={feature.title} className="animated-card rounded-2xl">
              <feature.icon className="h-6 w-6 text-cyan-300" />
              <h3 className="mt-5 text-lg font-black text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/48">{feature.body}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="relative mx-auto grid max-w-7xl gap-5 px-6 py-16 lg:grid-cols-3">
        {['“It feels like V0 and Cursor had a product-minded workflow.”', '“The generated schema and route docs saved a full planning cycle.”', '“Finally, a builder that feels like an IDE, not a toy.”'].map((quote) => (
          <GlassCard key={quote} className="rounded-2xl">
            <CheckCircle2 className="h-5 w-5 text-cyan-300" />
            <p className="mt-5 text-lg leading-8 text-white/70">{quote}</p>
          </GlassCard>
        ))}
      </section>

      <section className="relative mx-auto max-w-5xl px-6 py-16 text-center">
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] p-10">
          <Zap className="mx-auto h-8 w-8 text-cyan-300" />
          <h2 className="mt-5 text-3xl font-black text-white">Free to prototype. Pro when you ship.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/55">Unlimited local mock generation, project history, Supabase persistence, and deployment workflows designed for real teams.</p>
        </div>
      </section>
    </div>
  );
}
