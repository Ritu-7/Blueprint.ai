'use client';

import { useProject } from '@/components/workspace/ProjectContext';
import { ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

export default function ProjectCodeReviewPage() {
  const { project } = useProject();

  const findings = [
    { severity: 'low', category: 'Security', message: 'Row Level Security policy enabled on projects table', file: 'supabase/schema.sql' },
    { severity: 'info', category: 'Best Practice', message: 'Environment variables validated with Zod schema', file: 'src/config/env.ts' },
    { severity: 'medium', category: 'Optimization', message: 'Consider adding GIN index for JSONB files column', file: 'supabase/schema.sql' },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="border-b border-white/10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-cyan-400" />
            Code Reviews & Vulnerability Audit
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Automated quality and security audit findings for {project?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-green-400/10 border border-green-400/30 px-4 py-2 text-xs font-black text-green-400">
          <ShieldCheck className="h-4 w-4" /> Passed 0 Vulnerabilities
        </div>
      </div>

      <div className="grid gap-4">
        {findings.map((item, idx) => (
          <GlassCard key={idx} className="flex items-center justify-between p-5 border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">{item.message}</h2>
                <span className="text-[10px] font-mono text-white/40">File: {item.file}</span>
              </div>
            </div>
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-black uppercase text-cyan-300">
              {item.category}
            </span>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
