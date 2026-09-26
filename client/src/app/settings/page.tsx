import { Bell, KeyRound, Settings2, ShieldCheck, UserRound } from 'lucide-react';
import { WorkspacePage } from '@/components/app/WorkspacePage';

const settings = [
  { icon: UserRound, title: 'Profile and workspace', detail: 'Manage the identity and workspace details shown across Blueprint.' },
  { icon: Bell, title: 'Notifications', detail: 'Choose which generation and collaboration updates reach you.' },
  { icon: KeyRound, title: 'Integrations', detail: 'Connect GitHub and configure project delivery workflows.' },
  { icon: ShieldCheck, title: 'Security', detail: 'Review sign-in, session, and data access controls.' },
];

export default function SettingsPage() {
  return (
    <WorkspacePage eyebrow="Workspace controls" title="Settings" description="Configure your Blueprint workspace and the integrations that support your build loop." icon={Settings2}>
      <div className="grid gap-4 md:grid-cols-2">
        {settings.map(({ icon: Icon, title, detail }) => <button type="button" key={title} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] hover:border-cyan-400/40 hover:bg-white/[0.06]"><Icon className="h-5 w-5 text-cyan-300" /><h2 className="mt-6 text-xl font-black">{title}</h2><p className="mt-3 text-sm leading-6 text-white/50">{detail}</p><span className="mt-6 block text-xs font-black uppercase tracking-[0.18em] text-cyan-200 opacity-70 group-hover:opacity-100 transition-opacity duration-150">Configure</span></button>)}
      </div>
    </WorkspacePage>
  );
}
