import { FileCode2 } from 'lucide-react';
import { WorkspacePage } from '@/components/app/WorkspacePage';

export default function ApiDocsPage() {
  return <WorkspacePage eyebrow="Endpoint reference" title="API Terminal" description="The generated API contract stays close to the code so your backend decisions remain easy to inspect." icon={FileCode2}><section className="rounded-2xl border border-white/10 bg-black/20 p-6 font-mono text-sm"><p className="text-cyan-300">POST /api/generate</p><p className="mt-4 text-white/50">{'{ "prompt": "string" }'}</p><p className="mt-6 text-cyan-300">GET /api/projects</p><p className="mt-4 text-white/50">Returns the current project collection for the workspace.</p></section></WorkspacePage>;
}
