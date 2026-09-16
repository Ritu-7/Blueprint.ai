import Link from 'next/link';
import { ArrowLeft, Code2, FileText, Rocket } from 'lucide-react';
import { WorkspacePage } from '@/components/app/WorkspacePage';

type ProjectPageProps = {
  params: { id: string };
};

export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <WorkspacePage eyebrow="Project workspace" title="Project details" description="Review this blueprint and continue building it in the IDE." icon={Code2} actions={[{ label: 'Open Builder', href: '/builder' }]}>
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Project identifier</p>
        <p className="mt-3 break-all font-mono text-sm text-cyan-200">{params.id}</p>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-5"><FileText className="h-5 w-5 text-cyan-300" /><h2 className="mt-4 font-black">Generated files</h2><p className="mt-2 text-sm text-white/50">Open the Builder to inspect the current source, schema, and API contract.</p></div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-5"><Rocket className="h-5 w-5 text-cyan-300" /><h2 className="mt-4 font-black">Continue shipping</h2><p className="mt-2 text-sm text-white/50">Use the project actions in Builder when you are ready to export or connect GitHub.</p></div>
        </div>
        <Link href="/dashboard" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-cyan-200"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Link>
      </section>
    </WorkspacePage>
  );
}
