'use client';

import { useProject } from '@/components/workspace/ProjectContext';
import { ListTodo, Plus, CheckCircle2, Clock } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

export default function ProjectRequirementsPage() {
  const { project } = useProject();

  const mockRequirements = [
    { title: 'User Authentication & Session Management', category: 'Security', priority: 'High', status: 'Implemented' },
    { title: 'Database Schema Migration & Indexes', category: 'Database', priority: 'Critical', status: 'Implemented' },
    { title: 'AI Code & Blueprint Generation Engine', category: 'AI Core', priority: 'Critical', status: 'Implemented' },
    { title: 'GitHub Repository Sync & PR Automation', category: 'Integration', priority: 'High', status: 'In Review' },
    { title: 'Responsive Browser Device Preview', category: 'UI/UX', priority: 'Medium', status: 'Implemented' },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-cyan-400" />
            Project Requirements
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Functional and technical specifications for {project?.name}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-400/10 border border-cyan-400/30 px-4 py-2 text-xs font-black text-cyan-300 hover:bg-cyan-400/20 transition-colors">
          <Plus className="h-4 w-4" /> Add Requirement
        </button>
      </div>

      <div className="grid gap-4">
        {mockRequirements.map((req, idx) => (
          <GlassCard key={idx} className="flex items-center justify-between p-5 border-white/10 hover:border-cyan-400/30">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                {req.status === 'Implemented' ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Clock className="h-5 w-5 text-amber-400" />}
              </div>
              <div>
                <h2 className="text-sm font-black text-white">{req.title}</h2>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-white/40 uppercase">
                  <span>Category: {req.category}</span>
                  <span>•</span>
                  <span>Priority: <span className="text-cyan-300">{req.priority}</span></span>
                </div>
              </div>
            </div>

            <div className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/70">
              {req.status}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
