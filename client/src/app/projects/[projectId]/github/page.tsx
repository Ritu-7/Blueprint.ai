'use client';

import { useState } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import { GitBranch, GitPullRequest, Lock, Globe, UploadCloud, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { GithubModal } from '@/components/builder/GithubModal';
import { toast } from 'sonner';

export default function ProjectGithubPage() {
  const { project } = useProject();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="border-b border-white/10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-cyan-400" />
            GitHub Repository Integration
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Deploy blueprint source code directly to GitHub for {project?.name}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)]"
        >
          <UploadCloud className="h-4 w-4" /> Push Repository
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard className="p-6 border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-400" />
              <h2 className="text-base font-black text-white">Repository Settings</h2>
            </div>
            <span className="text-[10px] font-bold text-white/40 uppercase">Private</span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            Target Repository: <strong className="text-cyan-300">{project?.name.toLowerCase().replace(/\s+/g, '-')}</strong>
          </p>
          <div className="flex items-center gap-2 pt-4 border-t border-white/10 text-xs text-white/60">
            <GitBranch className="h-4 w-4 text-cyan-400" /> Default branch: <strong className="text-white">main</strong>
          </div>
        </GlassCard>

        <GlassCard className="p-6 border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <GitPullRequest className="h-5 w-5 text-purple-400" />
            <h2 className="text-base font-black text-white">Pull Request Actions</h2>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            Automatically create pull requests for newly generated features and code updates.
          </p>
          <button
            onClick={async () => {
              toast.promise(fetch('/api/github/pr', { method: 'POST' }), {
                loading: 'Creating PR on GitHub...',
                success: 'Pull request created successfully!',
                error: 'Failed to create PR',
              });
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/30 px-4 py-2.5 text-xs font-black text-purple-300 hover:bg-purple-500/20 transition-colors"
          >
            Create Pull Request
          </button>
        </GlassCard>
      </div>

      <GithubModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectName={project?.name || ''}
        files={project?.files || []}
        onSuccess={(url) => toast.success(`Pushed to ${url}`)}
      />
    </div>
  );
}
