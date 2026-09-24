'use client';

import React from 'react';
import {
  FolderGit2, GitBranch, Check, RefreshCw, Rocket,
  GitPullRequest, GitCommit, FileText, Download
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { cn } from '@/utils/utils';

export function WorkspaceHeader({
  projectName,
  projectDescription,
  branchName = 'main',
  isSaving,
  dirtyCount,
  onPushGithub,
  onOpenPR,
  onCommit,
  onViewReadme,
  onExport,
  onRegenerate,
  onDeploy,
}: {
  projectName?: string;
  projectDescription?: string;
  branchName?: string;
  isSaving?: boolean;
  dirtyCount?: number;
  onPushGithub: () => void;
  onOpenPR: () => void;
  onCommit: () => void;
  onViewReadme: () => void;
  onExport: () => void;
  onRegenerate: () => void;
  onDeploy: () => void;
}) {
  return (
    <div className="h-[72px] shrink-0 border-b border-white/[0.06] bg-[#0f131c] px-6 flex items-center justify-between select-none z-20">
      {/* Left Block: Icon, Title, Branch, Saved Pill, Truncated Description */}
      <div className="flex items-center gap-4 min-w-0 max-w-[55%]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 font-bold shadow-[0_0_15px_rgba(0,243,255,0.2)] shrink-0">
          <FolderGit2 className="h-5 w-5" />
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="truncate text-sm font-black text-white">{projectName || 'Blueprint Project Workspace'}</h1>

            <span className="flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/50 font-mono shrink-0">
              <GitBranch className="h-3 w-3 text-cyan-400" /> {branchName}
            </span>

            {/* Small SAVED Status Pill */}
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0">
              {isSaving ? (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300">Saving...</span>
                </>
              ) : (dirtyCount ?? 0) > 0 ? (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="text-amber-300">{dirtyCount} Unsaved</span>
                </>
              ) : (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span>Saved</span>
                </>
              )}
            </div>
          </div>

          <p className="truncate text-xs text-white/40 max-w-xl">
            {projectDescription || 'Central AI development workspace with integrated repository, multi-tab code editor, and AI assistant.'}
          </p>
        </div>
      </div>

      {/* Right Block: Segmented Toolbar (36x36) + Separate 40px Regenerate & Deploy Buttons */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Segmented Toolbar with 36x36px Hit Areas */}
        <div className="flex items-center rounded-lg border border-white/[0.06] bg-[#151a26] p-1">
          <button
            onClick={onPushGithub}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Push to GitHub"
            aria-label="Push to GitHub"
          >
            <FaGithub className="h-4 w-4 text-cyan-400" />
          </button>
          <button
            onClick={onOpenPR}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Create Pull Request"
            aria-label="Create Pull Request"
          >
            <GitPullRequest className="h-4 w-4 text-purple-400" />
          </button>
          <button
            onClick={onCommit}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Commit Changes"
            aria-label="Commit Changes"
          >
            <GitCommit className="h-4 w-4 text-emerald-400" />
          </button>
          <button
            onClick={onViewReadme}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="View Documentation / README"
            aria-label="View Documentation / README"
          >
            <FileText className="h-4 w-4 text-amber-400" />
          </button>
          <button
            onClick={onExport}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Download Workspace Archive"
            aria-label="Download Workspace Archive"
          >
            <Download className="h-4 w-4 text-blue-400" />
          </button>
        </div>

        {/* Separate Regenerate (Ghost 40px) */}
        <button
          onClick={onRegenerate}
          className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-wider"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Regenerate</span>
        </button>

        {/* Separate Deploy (Primary Gradient 40px) */}
        <button
          onClick={onDeploy}
          className="flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 px-5 text-xs font-black text-black hover:from-cyan-300 hover:to-blue-400 transition-all shadow-[0_0_15px_rgba(0,243,255,0.35)] uppercase tracking-wider"
        >
          <Rocket className="h-4 w-4 text-black" />
          <span>Deploy</span>
        </button>
      </div>
    </div>
  );
}
