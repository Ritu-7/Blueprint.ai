import { BookOpen, FileCode2 } from 'lucide-react';
import { WorkspacePage } from '@/components/app/WorkspacePage';

export default function DocsPage() {
  return <WorkspacePage eyebrow="Reference library" title="Documentation" description="Understand the Blueprint workspace, generated files, previews, and project delivery flow." icon={BookOpen} actions={[{ label: 'Open Builder', href: '/builder' }]}><div className="grid gap-4 md:grid-cols-2"><section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><FileCode2 className="h-5 w-5 text-cyan-300" /><h2 className="mt-5 text-xl font-black">Generated project anatomy</h2><p className="mt-3 text-sm leading-6 text-white/50">Every blueprint includes a live preview, UI code, API contract, schema, and an explorer-ready file list.</p></section><section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><BookOpen className="h-5 w-5 text-cyan-300" /><h2 className="mt-5 text-xl font-black">Build workflow</h2><p className="mt-3 text-sm leading-6 text-white/50">Start with a prompt, inspect the result, refine the source, and use GitHub actions when the project is ready to move.</p></section></div></WorkspacePage>;
}
