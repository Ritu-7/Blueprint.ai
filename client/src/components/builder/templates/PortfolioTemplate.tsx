import { ArrowUpRight, Sparkles } from 'lucide-react';

export function PortfolioTemplate({ title }: { title: string }) {
  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
          <Sparkles className="h-8 w-8 text-cyan-300" />
          <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">A premium portfolio system with case studies, positioning, and inquiry capture.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {['Brand Systems', 'AI Products', 'Editorial Platforms'].map((project) => (
            <article key={project} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="mb-8 aspect-video rounded-xl bg-cyan-400/10" />
              <div className="flex items-center justify-between">
                <h2 className="font-black">{project}</h2>
                <ArrowUpRight className="h-4 w-4 text-cyan-300" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

