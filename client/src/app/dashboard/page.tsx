import Link from 'next/link';
import { Activity, ArrowUpRight, CheckCircle2, FolderKanban, Sparkles } from 'lucide-react';
import { WorkspacePage } from '@/components/app/WorkspacePage';

const metrics = [
  { label: 'Active blueprints', value: '06', detail: '+2 this month' },
  { label: 'Generation runs', value: '24', detail: '98% completed' },
  { label: 'Saved components', value: '118', detail: 'Across 6 projects' },
];

export default function DashboardPage() {
  return (
    <WorkspacePage eyebrow="Command center" title="Dashboard" description="A focused view of your projects, generation activity, and the next useful action." icon={FolderKanban} actions={[{ label: 'Open Builder', href: '/builder' }]}>
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <section key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{metric.label}</p>
            <p className="mt-5 text-4xl font-black text-white">{metric.value}</p>
            <p className="mt-2 text-sm text-cyan-200/70">{metric.detail}</p>
          </section>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Recent activity</p><h2 className="mt-2 text-2xl font-black">Your workspace is moving</h2></div>
            <Activity className="h-6 w-6 text-cyan-300" />
          </div>
          <div className="mt-8 space-y-4">
            {['Pipeline CRM generated', 'Schema contract reviewed', 'Preview shared with your team'].map((item) => <div key={item} className="flex items-center gap-3 border-t border-white/10 pt-4 text-sm text-white/65"><CheckCircle2 className="h-4 w-4 text-cyan-300" />{item}</div>)}
          </div>
        </section>
        <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-6">
          <Sparkles className="h-6 w-6 text-cyan-300" />
          <h2 className="mt-5 text-2xl font-black">Start with a prompt</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">Turn an idea into a working project with files, API docs, schema, and a live preview.</p>
          <Link href="/builder" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-200">Launch Builder <ArrowUpRight className="h-4 w-4" /></Link>
        </section>
      </div>
    </WorkspacePage>
  );
}
