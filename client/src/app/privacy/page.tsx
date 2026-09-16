import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { WorkspacePage } from '@/components/app/WorkspacePage';

export default function PrivacyPage() {
  return <WorkspacePage eyebrow="Trust center" title="Privacy Protocol" description="A clear overview of how Blueprint treats workspace data, generated source, and connected services." icon={LockKeyhole}><div className="grid gap-4 md:grid-cols-2"><section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><ShieldCheck className="h-5 w-5 text-cyan-300" /><h2 className="mt-5 text-xl font-black">Your project data</h2><p className="mt-3 text-sm leading-6 text-white/50">Projects are stored through the configured persistence layer and remain associated with the authenticated workspace.</p></section><section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><LockKeyhole className="h-5 w-5 text-cyan-300" /><h2 className="mt-5 text-xl font-black">Connected services</h2><p className="mt-3 text-sm leading-6 text-white/50">Clerk handles authentication while GitHub actions run only when you explicitly initiate them.</p></section></div></WorkspacePage>;
}
