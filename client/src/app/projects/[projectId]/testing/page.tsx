'use client';

import { useProject } from '@/components/workspace/ProjectContext';
import { TestTube, Play, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

export default function ProjectTestingPage() {
  const { project } = useProject();

  const testSuites = [
    { name: 'TypeScript Typecheck (tsc)', status: 'passing', duration: '1.2s' },
    { name: 'Next.js App Router Build', status: 'passing', duration: '4.8s' },
    { name: 'Supabase RLS Policy Validation', status: 'passing', duration: '0.9s' },
    { name: 'Clerk User Authentication Flow', status: 'passing', duration: '1.5s' },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="border-b border-white/10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <TestTube className="h-6 w-6 text-cyan-400" />
            Testing & Test Suite Runner
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Automated unit, integration, and build validation for {project?.name}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)]">
          <Play className="h-4 w-4" /> Run All Tests
        </button>
      </div>

      <div className="grid gap-4">
        {testSuites.map((suite) => (
          <GlassCard key={suite.name} className="flex items-center justify-between p-5 border-white/10">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <div>
                <h2 className="text-sm font-black text-white">{suite.name}</h2>
                <span className="text-[10px] font-mono text-white/40">Duration: {suite.duration}</span>
              </div>
            </div>
            <span className="rounded-full bg-green-400/10 border border-green-400/30 px-3 py-1 text-[10px] font-black uppercase text-green-400">
              {suite.status}
            </span>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
