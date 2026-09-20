'use client';

import Link from 'next/link';
import {
  Sparkles,
  ArrowUpRight,
  FileCode2,
  Database,
  Terminal,
  Activity,
  Calendar,
  Layers,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '@/components/workspace/ProjectContext';
import { GlassCard } from '@/components/GlassCard';

export default function ProjectOverviewPage() {
  const { project } = useProject();

  const formattedDate = project?.created_at
    ? new Date(project.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const fileCount = Array.isArray(project?.files) ? project.files.length : 5;

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Overview Hero Header */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              {project?.kind || 'Blueprint Workspace'}
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl text-white">{project?.name}</h1>
            <p className="max-w-2xl text-sm leading-6 text-white/60">
              {project?.description || 'AI-generated application blueprint with complete workspace state.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/projects/${project?.id}/builder`}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(0,243,255,0.35)]"
            >
              Launch Builder IDE <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Generated Files', value: `${fileCount}`, icon: FileCode2, detail: 'TSX, SQL, Markdown' },
          { label: 'Database Schema', value: project?.schema_code ? 'Active' : 'Draft', icon: Database, detail: 'PostgreSQL ready' },
          { label: 'API Contract', value: project?.api_code ? 'Defined' : 'Pending', icon: Terminal, detail: 'REST endpoints' },
          { label: 'Created Date', value: formattedDate, icon: Calendar, detail: 'Auto-saved in cloud' },
        ].map((stat) => (
          <GlassCard key={stat.label} className="rounded-2xl p-5 border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="mt-4 text-3xl font-black text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-cyan-200/70">{stat.detail}</p>
          </GlassCard>
        ))}
      </div>

      {/* Workspace Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Original Prompt & Kind */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-widest">
            <Bot className="h-4 w-4" /> Original Prompt Context
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-cyan-100/90 leading-relaxed">
            {`"${project?.prompt || 'Create a full-stack SaaS application with auth, database, and analytics.'}"`}
          </div>
          <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/10">
            <span>Template Kind: <strong className="text-white font-bold">{project?.kind}</strong></span>
            <span>Status: <strong className="text-green-400 font-bold uppercase">{project?.status}</strong></span>
          </div>
        </section>

        {/* Quick Section Shortcuts */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-widest">
            <Layers className="h-4 w-4" /> Workspace Sections
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Blueprint Code', href: `/projects/${project?.id}/blueprint` },
              { name: 'Requirements', href: `/projects/${project?.id}/requirements` },
              { name: 'Architecture', href: `/projects/${project?.id}/architecture` },
              { name: 'Database Schema', href: `/projects/${project?.id}/database` },
              { name: 'API Endpoints', href: `/projects/${project?.id}/apis` },
              { name: 'GitHub Integration', href: `/projects/${project?.id}/github` },
            ].map((shortcut) => (
              <Link
                key={shortcut.name}
                href={shortcut.href}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-xs font-bold text-white/70 hover:border-cyan-400/40 hover:bg-white/[0.06] hover:text-white transition-all"
              >
                <span>{shortcut.name}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-cyan-400" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
