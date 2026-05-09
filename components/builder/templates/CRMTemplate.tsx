import { DollarSign, Users } from 'lucide-react';

const stages = ['Qualified', 'Proposal', 'Negotiation', 'Closed'];

export function CRMTemplate({ title }: { title: string }) {
  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Revenue Workspace</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/55">Pipeline intelligence with deal stages, forecast totals, and next-best actions.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-cyan-400/20 bg-white/[0.035] p-5"><DollarSign className="h-5 w-5 text-cyan-300" /><strong className="mt-3 block text-3xl">$284K</strong><p className="text-xs text-white/40">Weighted pipeline</p></article>
          <article className="rounded-2xl border border-cyan-400/20 bg-white/[0.035] p-5"><Users className="h-5 w-5 text-cyan-300" /><strong className="mt-3 block text-3xl">47</strong><p className="text-xs text-white/40">Active accounts</p></article>
        </div>
        <section className="grid gap-4 md:grid-cols-4">
          {stages.map((stage) => (
            <div key={stage} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{stage}</h2>
              <div className="mt-4 rounded-xl bg-white/[0.04] p-4 text-sm text-white/70">Acme Studio<br /><span className="text-cyan-300">$24,000</span></div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
