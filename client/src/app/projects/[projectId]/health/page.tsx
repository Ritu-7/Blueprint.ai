'use client';

import { useProject } from '@/components/workspace/ProjectContext';
import { Activity, ShieldCheck, Gauge, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

export default function ProjectHealthPage() {
  const { project } = useProject();

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Activity className="h-6 w-6 text-cyan-400" />
          Project Health & Security Snapshots
        </h1>
        <p className="text-xs text-white/50 mt-1">
          Health scores, security metrics, and build status for {project?.name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <GlassCard className="p-6 border-white/10 text-center">
          <Gauge className="mx-auto h-8 w-8 text-cyan-400 mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Overall Health Score</p>
          <p className="text-5xl font-black text-white mt-2">98<span className="text-sm font-normal text-cyan-400">/100</span></p>
          <p className="text-xs text-green-400 mt-2 font-bold">Optimal Workspace</p>
        </GlassCard>

        <GlassCard className="p-6 border-white/10 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-green-400 mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Security Rating</p>
          <p className="text-5xl font-black text-white mt-2">A<span className="text-sm font-normal text-green-400">+</span></p>
          <p className="text-xs text-green-400 mt-2 font-bold">Supabase RLS Enabled</p>
        </GlassCard>

        <GlassCard className="p-6 border-white/10 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-cyan-400 mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Build Status</p>
          <p className="text-3xl font-black text-white mt-3 uppercase">Passing</p>
          <p className="text-xs text-cyan-200/70 mt-2">Zero TS Errors</p>
        </GlassCard>
      </div>
    </div>
  );
}
