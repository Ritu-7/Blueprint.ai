'use client';

import { useProject } from '@/components/workspace/ProjectContext';
import { Network, Server, Database, Shield, Cpu, Globe, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

export default function ProjectArchitecturePage() {
  const { project } = useProject();

  const components = [
    { name: 'Next.js App Router', type: 'Frontend / Client', icon: Globe, status: 'Active', tech: 'React 18 + Tailwind' },
    { name: 'Blueprint API Router', type: 'API Gateway', icon: Server, status: 'Active', tech: 'Node.js Route Handlers' },
    { name: 'Supabase PostgreSQL', type: 'Database & Auth', icon: Database, status: 'Active', tech: 'RLS + Migration Engine' },
    { name: 'Clerk Identity Provider', type: 'Auth & RBAC', icon: Shield, status: 'Active', tech: 'OAuth + JWT' },
    { name: 'AI Generation Engine', type: 'Compute Service', icon: Cpu, status: 'Active', tech: 'Google Gemini' },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Network className="h-6 w-6 text-cyan-400" />
          Architecture & System Components
        </h1>
        <p className="text-xs text-white/50 mt-1">
          System topology and data flow connections for {project?.name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {components.map((comp) => (
          <GlassCard key={comp.name} className="p-6 border-white/10 hover:border-cyan-400/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-300">
                <comp.icon className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-green-400/10 border border-green-400/30 px-3 py-1 text-[10px] font-black uppercase text-green-400">
                {comp.status}
              </span>
            </div>
            <h2 className="text-lg font-black text-white">{comp.name}</h2>
            <p className="text-xs text-cyan-300 font-bold mt-1">{comp.type}</p>
            <p className="text-[10px] text-white/40 uppercase mt-4 pt-4 border-t border-white/10">
              Tech Stack: {comp.tech}
            </p>
          </GlassCard>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-white/60 mb-4">Data Flow Connections</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-white/80">
          <span className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">User Interface</span>
          <ArrowRight className="h-4 w-4 text-cyan-400" />
          <span className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">Clerk Auth & API Routes</span>
          <ArrowRight className="h-4 w-4 text-cyan-400" />
          <span className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">Supabase PostgreSQL RLS</span>
        </div>
      </div>
    </div>
  );
}
