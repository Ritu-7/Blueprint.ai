import Link from 'next/link';
import { ArrowRight, BarChart3, BookOpen, Boxes, CircleHelp, FileCode2, LockKeyhole, Settings2, ShieldCheck } from 'lucide-react';

type WorkspacePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof BarChart3;
  actions?: { label: string; href: string }[];
  children: React.ReactNode;
};

export function WorkspacePage({ eyebrow, title, description, icon: Icon, actions = [], children }: WorkspacePageProps) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#05070a] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <header className="flex flex-col gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              <Icon className="h-4 w-4" />
              {eyebrow}
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55">{description}</p>
          </div>
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link key={action.href} href={action.href} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-[#05070a] transition hover:bg-cyan-300">
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          )}
        </header>
        <main className="py-10">{children}</main>
      </div>
    </div>
  );
}

export const workspaceIcons = { BarChart3, BookOpen, Boxes, CircleHelp, FileCode2, LockKeyhole, Settings2, ShieldCheck };
