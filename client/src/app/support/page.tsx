import { CircleHelp, MessageSquare } from 'lucide-react';
import { WorkspacePage } from '@/components/app/WorkspacePage';

export default function SupportPage() {
  return <WorkspacePage eyebrow="Help desk" title="Support" description="Find the right place to ask about a generation, integration, or project workflow." icon={CircleHelp}><section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><MessageSquare className="h-5 w-5 text-cyan-300" /><h2 className="mt-5 text-xl font-black">Talk to the Blueprint team</h2><p className="mt-3 text-sm leading-6 text-white/50">Support workflows are ready for project-specific questions. Include the project name and the step where you got stuck.</p><a href="mailto:support@blueprint.ai" className="mt-6 inline-flex rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-[#05070a]">Email support</a></section></WorkspacePage>;
}
