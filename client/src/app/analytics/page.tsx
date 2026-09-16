import { BarChart3, Gauge, TrendingUp } from 'lucide-react';
import { WorkspacePage } from '@/components/app/WorkspacePage';

export default function AnalyticsPage() {
  return (
    <WorkspacePage eyebrow="Workspace intelligence" title="Analytics" description="See how quickly ideas become usable blueprints and where your workflow is gaining momentum." icon={BarChart3} actions={[{ label: 'Generate a project', href: '/builder' }]}>
      <div className="grid gap-4 md:grid-cols-3">
        {[['Build velocity', '4.8x', 'vs. a blank canvas'], ['Preview quality', '92%', 'ready on first pass'], ['Team handoff', '18m', 'average to share']].map(([label, value, detail]) => <section key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{label}</p><p className="mt-5 text-4xl font-black">{value}</p><p className="mt-2 text-sm text-cyan-200/70">{detail}</p></section>)}
      </div>
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-cyan-300" /><h2 className="text-xl font-black">Generation performance</h2></div>
        <div className="mt-8 grid h-48 grid-cols-8 items-end gap-3">{[38, 56, 44, 72, 64, 86, 78, 96].map((height, index) => <div key={index} className="rounded-t-lg bg-cyan-400/70" style={{ height: `${height}%` }} aria-label={`Week ${index + 1}: ${height}%`} />)}</div>
        <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-white/35"><span>Last 8 weeks</span><span className="inline-flex items-center gap-2"><Gauge className="h-3.5 w-3.5" /> Live workspace data</span></div>
      </section>
    </WorkspacePage>
  );
}
