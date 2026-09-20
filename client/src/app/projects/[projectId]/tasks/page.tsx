'use client';

import { useProject } from '@/components/workspace/ProjectContext';
import { CheckSquare, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

export default function ProjectTasksPage() {
  const { project } = useProject();

  const tasks = [
    { title: 'Initialize Next.js 14 App Router project structure', status: 'completed', priority: 'high' },
    { title: 'Define Supabase RLS security policies & migrations', status: 'completed', priority: 'critical' },
    { title: 'Implement Clerk Authentication & Navbar user button', status: 'completed', priority: 'high' },
    { title: 'Connect Builder auto-save & Supabase project service', status: 'in_progress', priority: 'medium' },
    { title: 'Run automated E2E test suite & vulnerability audit', status: 'todo', priority: 'medium' },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-cyan-400" />
            Development Tasks
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Task tracking and workflow progression for {project?.name}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-400/10 border border-cyan-400/30 px-4 py-2 text-xs font-black text-cyan-300 hover:bg-cyan-400/20 transition-colors">
          <Plus className="h-4 w-4" /> Create Task
        </button>
      </div>

      <div className="grid gap-4">
        {tasks.map((task, idx) => (
          <GlassCard key={idx} className="flex items-center justify-between p-5 border-white/10 hover:border-cyan-400/30">
            <div className="flex items-center gap-4">
              {task.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
              ) : task.status === 'in_progress' ? (
                <Clock className="h-5 w-5 text-amber-400 flex-shrink-0 animate-pulse" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-white/40 flex-shrink-0" />
              )}
              <div>
                <h2 className="text-sm font-black text-white">{task.title}</h2>
                <span className="text-[10px] font-bold text-white/40 uppercase">Priority: {task.priority}</span>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                task.status === 'completed'
                  ? 'bg-green-400/10 border border-green-400/30 text-green-400'
                  : task.status === 'in_progress'
                  ? 'bg-amber-400/10 border border-amber-400/30 text-amber-300'
                  : 'bg-white/5 border border-white/10 text-white/50'
              }`}
            >
              {task.status.replace('_', ' ')}
            </span>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
