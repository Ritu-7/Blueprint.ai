import { Activity, BarChart3, TrendingUp } from 'lucide-react';

export function DashboardTemplate({ title }: { title: string }) {
  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Analytics Command</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/55">Executive KPIs, reporting workflows, and live operational signals in one generated dashboard.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {[['Revenue', '$84.2K'], ['Active Users', '18.4K'], ['Uptime', '99.98%']].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-cyan-400/20 bg-white/[0.035] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">{label}</p>
              <strong className="mt-3 block text-3xl font-black">{value}</strong>
            </article>
          ))}
        </div>
        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center gap-2 text-cyan-200"><BarChart3 className="h-4 w-4" /> Generation volume</div>
            <div className="flex h-72 items-end gap-3 rounded-xl bg-white/[0.025] p-5">
              {[42, 64, 52, 80, 72, 96, 88].map((height, index) => <div key={index} className="flex-1 rounded-t-lg bg-cyan-400/70" style={{ height: `${height}%` }} />)}
            </div>
          </div>
          <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <TrendingUp className="h-6 w-6 text-cyan-300" />
            <p className="mt-5 text-sm leading-6 text-white/55">AI detected elevated conversion from template-backed generation sessions.</p>
            <Activity className="mt-8 h-10 w-10 text-white/20" />
          </aside>
        </section>
      </section>
    </main>
  );
}
