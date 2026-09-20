'use client';

import { useProject } from '@/components/workspace/ProjectContext';
import { Terminal } from 'lucide-react';
import { CodeEditor } from '@/components/builder/CodeEditor';

export default function ProjectApisPage() {
  const { project } = useProject();

  return (
    <div className="flex h-full flex-col p-6 space-y-6">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Terminal className="h-6 w-6 text-cyan-400" />
          API Terminal & Endpoints Contract
        </h1>
        <p className="text-xs text-white/50 mt-1">
          REST API specifications and request/response shapes for {project?.name}
        </p>
      </div>

      <div className="flex-1 min-h-[500px] rounded-2xl border border-white/10 bg-[#070a0f] overflow-hidden">
        <CodeEditor title="docs/api.md" fallbackContent={project?.api_code || 'GET /api/health\nPOST /api/generate'} />
      </div>
    </div>
  );
}
