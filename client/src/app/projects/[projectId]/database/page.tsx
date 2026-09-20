'use client';

import { useProject } from '@/components/workspace/ProjectContext';
import { Database } from 'lucide-react';
import { CodeEditor } from '@/components/builder/CodeEditor';

export default function ProjectDatabasePage() {
  const { project } = useProject();

  return (
    <div className="flex h-full flex-col p-6 space-y-6">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Database className="h-6 w-6 text-cyan-400" />
          Database Schema & Inspector
        </h1>
        <p className="text-xs text-white/50 mt-1">
          PostgreSQL table definitions and SQL migration schema for {project?.name}
        </p>
      </div>

      <div className="flex-1 min-h-[500px] rounded-2xl border border-white/10 bg-[#070a0f] overflow-hidden">
        <CodeEditor title="supabase/schema.sql" fallbackContent={project?.schema_code || '-- PostgreSQL Schema'} />
      </div>
    </div>
  );
}
