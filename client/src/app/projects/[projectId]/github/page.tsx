'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import { toast } from 'sonner';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  RefreshCw,
  Plus,
  FileCode2,
  Folder,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Diff,
  Star,
  Lock,
  Globe,
  UploadCloud,
  Link2,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { GlassCard } from '@/components/GlassCard';
import { GithubModal } from '@/components/builder/GithubModal';
import { cn } from '@/utils/utils';
import type {
  GithubRepo,
  GithubBranch,
  GithubCommit,
  GithubFileEntry,
  GithubDiffFile,
  GithubPullRequest,
} from '@/validators/github';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type HubTab = 'overview' | 'branches' | 'commits' | 'files' | 'diff' | 'pulls';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function DiffBadge({ additions, deletions }: { additions: number; deletions: number }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono">
      {additions > 0 && <span className="text-emerald-400">+{additions}</span>}
      {deletions > 0 && <span className="text-red-400">-{deletions}</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    added: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    removed: 'bg-red-500/20 text-red-300 border-red-500/30',
    modified: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    renamed: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    open: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    closed: 'bg-red-500/20 text-red-300 border-red-500/30',
    merged: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  };
  return (
    <span className={cn('rounded border px-2 py-0.5 text-[10px] uppercase font-bold', map[status] || 'bg-white/10 text-white/50 border-white/10')}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-panels
// ─────────────────────────────────────────────────────────────────────────────

function ConnectRepoPanel({ onConnected }: { onConnected: (repo: GithubRepo) => void }) {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualOwner, setManualOwner] = useState('');
  const [manualRepo, setManualRepo] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [showList, setShowList] = useState(false);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/github/repos');
      const data = await res.json();
      if (data.success) {
        setRepos(data.data);
        setShowList(true);
      } else {
        toast.error(data.error?.message || 'Failed to load repositories');
      }
    } catch {
      toast.error('Failed to reach GitHub API');
    } finally {
      setLoading(false);
    }
  };

  const connectRepo = async (owner: string, repo: string) => {
    setConnecting(true);
    try {
      const res = await fetch('/api/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: '00000000-0000-0000-0000-000000000000', owner, repo }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Connected to ${owner}/${repo}`);
        onConnected(data.data.repo);
      } else {
        toast.error(data.error?.message || 'Connection failed');
      }
    } catch {
      toast.error('Failed to connect repository');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-dashed border-cyan-400/30 bg-cyan-950/10 p-8 text-center">
        <FaGithub className="mx-auto mb-4 h-10 w-10 text-white/30" />
        <h3 className="text-base font-black text-white mb-1">No Repository Connected</h3>
        <p className="text-xs text-white/50 mb-6">Connect a GitHub repository to view branches, commits, files, and create pull requests.</p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={loadRepos}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 text-xs font-black text-black hover:bg-cyan-300 disabled:opacity-50 transition"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FaGithub className="h-4 w-4" />}
            Browse My Repositories
          </button>
        </div>
      </div>

      {showList && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Select a Repository</p>
          <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
            {repos.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 hover:border-cyan-400/30 transition">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {r.private ? <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" /> : <Globe className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                    <span className="font-bold text-white text-sm truncate">{r.full_name}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 truncate">{r.description || 'No description'}</p>
                </div>
                <button
                  onClick={() => connectRepo(r.owner, r.name)}
                  disabled={connecting}
                  className="ml-4 shrink-0 rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-400/20 hover:border-cyan-400/30 hover:text-cyan-200 transition disabled:opacity-50"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual connect */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Or Connect Manually</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="owner"
            value={manualOwner}
            onChange={(e) => setManualOwner(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
          />
          <span className="flex items-center text-white/40">/</span>
          <input
            type="text"
            placeholder="repository"
            value={manualRepo}
            onChange={(e) => setManualRepo(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
          />
          <button
            onClick={() => connectRepo(manualOwner.trim(), manualRepo.trim())}
            disabled={!manualOwner.trim() || !manualRepo.trim() || connecting}
            className="rounded-lg bg-cyan-400/20 border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/30 disabled:opacity-30 transition"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({
  repo,
  activeBranch,
  onPushFiles,
  projectFiles,
  projectName,
}: {
  repo: GithubRepo;
  activeBranch: string;
  onPushFiles: () => void;
  projectFiles: any[];
  projectName: string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 border-white/10 space-y-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Repository</p>
          <div className="flex items-center gap-2">
            {repo.private ? <Lock className="h-4 w-4 text-amber-400" /> : <Globe className="h-4 w-4 text-emerald-400" />}
            <p className="font-black text-white text-sm">{repo.full_name}</p>
          </div>
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
            <ExternalLink className="h-3 w-3" /> Open on GitHub
          </a>
        </GlassCard>

        <GlassCard className="p-5 border-white/10 space-y-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Active Branch</p>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-cyan-400" />
            <p className="font-black text-white text-sm">{activeBranch}</p>
          </div>
          <p className="text-xs text-white/40">Default: {repo.default_branch}</p>
        </GlassCard>

        <GlassCard className="p-5 border-white/10 space-y-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Project Files</p>
          <p className="font-black text-white text-2xl">{projectFiles.length}</p>
          <p className="text-xs text-white/40">ready to push</p>
        </GlassCard>
      </div>

      <GlassCard className="p-6 border-white/10">
        <h3 className="font-black text-white mb-4 flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-cyan-400" />
          Push Project Files to GitHub
        </h3>
        <p className="text-xs text-white/50 mb-4">
          Push all <strong className="text-white">{projectFiles.length} blueprint files</strong> from <strong className="text-white">{projectName}</strong> to <strong className="text-cyan-300">{repo.full_name}</strong> on branch <strong className="text-white">{activeBranch}</strong>.
        </p>
        <button
          onClick={onPushFiles}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-black hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(0,243,255,0.2)]"
        >
          <UploadCloud className="h-4 w-4" />
          Push {projectFiles.length} Files to {repo.name}
        </button>
      </GlassCard>
    </div>
  );
}

function BranchesPanel({ owner, repo, activeBranch, onSelectBranch }: { owner: string; repo: string; activeBranch: string; onSelectBranch: (b: string) => void }) {
  const [branches, setBranches] = useState<GithubBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [fromBranch, setFromBranch] = useState(activeBranch);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`/api/github/branches?owner=${owner}&repo=${repo}`)
      .then((r) => r.json())
      .then((d) => d.success && setBranches(d.data))
      .catch(() => toast.error('Failed to load branches'))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/github/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, branchName: newBranchName.trim(), fromBranch }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Branch "${newBranchName}" created`);
        setBranches((prev) => [...prev, { name: newBranchName.trim(), sha: data.data.sha, protected: false }]);
        setNewBranchName('');
        setShowCreate(false);
      } else {
        toast.error(data.error?.message || 'Failed to create branch');
      }
    } catch {
      toast.error('Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-xs text-white/50 py-8 justify-center"><RefreshCw className="h-4 w-4 animate-spin" />Loading branches...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20 transition"
        >
          <Plus className="h-3.5 w-3.5" /> New Branch
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createBranch} className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-4 space-y-3">
          <p className="text-xs font-bold text-cyan-200">Create New Branch</p>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder="feature/new-branch"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
            <select
              value={fromBranch}
              onChange={(e) => setFromBranch(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0a0d14] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              {branches.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-bold text-black hover:bg-cyan-300 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Branch'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {branches.map((b) => (
          <div
            key={b.name}
            className={cn(
              'flex items-center justify-between rounded-lg border px-4 py-3 transition cursor-pointer',
              activeBranch === b.name
                ? 'border-cyan-400/30 bg-cyan-400/5'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
            )}
            onClick={() => onSelectBranch(b.name)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <GitBranch className={cn('h-4 w-4 shrink-0', activeBranch === b.name ? 'text-cyan-400' : 'text-white/40')} />
              <span className={cn('font-medium text-sm truncate', activeBranch === b.name ? 'text-cyan-100' : 'text-white')}>{b.name}</span>
              {b.protected && <Lock className="h-3 w-3 text-amber-400 shrink-0" />}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-white/30">{b.sha.slice(0, 7)}</span>
              {activeBranch === b.name && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommitsPanel({ owner, repo, branch }: { owner: string; repo: string; branch: string }) {
  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/github/commits?owner=${owner}&repo=${repo}&branch=${branch}`)
      .then((r) => r.json())
      .then((d) => d.success && setCommits(d.data))
      .catch(() => toast.error('Failed to load commits'))
      .finally(() => setLoading(false));
  }, [owner, repo, branch]);

  if (loading) return <div className="flex items-center gap-2 text-xs text-white/50 py-8 justify-center"><RefreshCw className="h-4 w-4 animate-spin" />Loading commits...</div>;

  return (
    <div className="space-y-2">
      {commits.length === 0 && (
        <div className="text-center py-12 text-xs text-white/30">No commits found on branch <strong className="text-white">{branch}</strong></div>
      )}
      {commits.map((c, i) => (
        <div key={c.sha} className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 hover:border-white/20 transition">
          <div className="relative shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5">
              {c.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.authorAvatar} alt={c.author} className="h-full w-full rounded-full" />
              ) : (
                <GitCommit className="h-4 w-4 text-white/40" />
              )}
            </div>
            {i < commits.length - 1 && <div className="absolute left-1/2 top-7 h-full w-[1px] -translate-x-1/2 bg-white/5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{c.message}</p>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-white/40">
              <span>{c.author}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(c.date)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[11px] text-white/30">{c.sha.slice(0, 7)}</span>
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-cyan-300">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function FilesPanel({ owner, repo, branch }: { owner: string; repo: string; branch: string }) {
  const [files, setFiles] = useState<GithubFileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPath = useCallback(
    (path: string) => {
      setLoading(true);
      setCurrentPath(path);
      fetch(`/api/github/files?owner=${owner}&repo=${repo}&branch=${branch}&path=${encodeURIComponent(path)}`)
        .then((r) => r.json())
        .then((d) => d.success && setFiles(d.data))
        .catch(() => toast.error('Failed to load files'))
        .finally(() => setLoading(false));
    },
    [owner, repo, branch]
  );

  useEffect(() => {
    loadPath('');
  }, [loadPath]);

  const pathParts = currentPath ? currentPath.split('/') : [];

  if (loading) return <div className="flex items-center gap-2 text-xs text-white/50 py-8 justify-center"><RefreshCw className="h-4 w-4 animate-spin" />Loading files...</div>;

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-white/50">
        <button onClick={() => loadPath('')} className="hover:text-cyan-300">{repo}</button>
        {pathParts.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <button
              onClick={() => loadPath(pathParts.slice(0, i + 1).join('/'))}
              className="hover:text-cyan-300"
            >
              {part}
            </button>
          </span>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        {files.sort((a, b) => (a.type === 'dir' ? -1 : 1) - (b.type === 'dir' ? -1 : 1)).map((file, i) => (
          <div
            key={file.sha}
            className={cn(
              'flex items-center justify-between px-4 py-2.5 text-xs hover:bg-white/5 transition cursor-pointer',
              i !== 0 && 'border-t border-white/5'
            )}
            onClick={() => file.type === 'dir' && loadPath(file.path)}
          >
            <div className="flex items-center gap-2.5">
              {file.type === 'dir'
                ? <Folder className="h-4 w-4 text-cyan-300/70 shrink-0" />
                : <FileCode2 className="h-4 w-4 text-white/40 shrink-0" />}
              <span className={cn('font-medium', file.type === 'dir' ? 'text-cyan-100' : 'text-white/80')}>{file.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {file.size > 0 && <span className="text-white/30">{(file.size / 1024).toFixed(1)}KB</span>}
              <a href={file.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-white/20 hover:text-cyan-300">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiffPanel({ owner, repo, activeBranch, defaultBranch }: { owner: string; repo: string; activeBranch: string; defaultBranch: string }) {
  const [base, setBase] = useState(defaultBranch);
  const [head, setHead] = useState(activeBranch);
  const [diff, setDiff] = useState<GithubDiffFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const loadDiff = async () => {
    if (base === head) { toast.error('Base and head branch cannot be the same'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/github/diff?owner=${owner}&repo=${repo}&base=${base}&head=${head}`);
      const data = await res.json();
      if (data.success) { setDiff(data.data); setFetched(true); }
      else toast.error(data.error?.message || 'Failed to load diff');
    } catch {
      toast.error('Failed to load diff');
    } finally {
      setLoading(false);
    }
  };

  const totalAdditions = diff.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = diff.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
          <span className="text-white/40">base:</span>
          <input value={base} onChange={(e) => setBase(e.target.value)} className="bg-transparent text-white outline-none w-28" />
        </div>
        <span className="text-white/30">→</span>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
          <span className="text-white/40">head:</span>
          <input value={head} onChange={(e) => setHead(e.target.value)} className="bg-transparent text-white outline-none w-28" />
        </div>
        <button onClick={loadDiff} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/20 border border-cyan-400/30 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/30 disabled:opacity-50 transition">
          {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Diff className="h-3.5 w-3.5" />}
          Compare
        </button>
      </div>

      {fetched && (
        <>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>{diff.length} files changed</span>
            <span className="text-emerald-400 font-mono">+{totalAdditions}</span>
            <span className="text-red-400 font-mono">-{totalDeletions}</span>
          </div>

          <div className="space-y-2">
            {diff.length === 0 ? (
              <div className="text-center py-8 text-xs text-white/30">No differences found between <strong className="text-white">{base}</strong> and <strong className="text-white">{head}</strong></div>
            ) : (
              diff.map((f) => (
                <div key={f.filename} className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode2 className="h-4 w-4 text-white/40 shrink-0" />
                      <span className="font-mono text-xs text-white truncate">{f.filename}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <DiffBadge additions={f.additions} deletions={f.deletions} />
                      <StatusBadge status={f.status} />
                    </div>
                  </div>
                  {f.patch && (
                    <pre className="max-h-40 overflow-auto rounded bg-black/40 p-2 font-mono text-[10px] leading-4 text-white/60 whitespace-pre-wrap">
                      {f.patch}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PullsPanel({
  owner,
  repo,
  activeBranch,
  defaultBranch,
}: {
  owner: string;
  repo: string;
  activeBranch: string;
  defaultBranch: string;
}) {
  const [pulls, setPulls] = useState<GithubPullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [prTitle, setPrTitle] = useState('feat: AI Blueprint generated updates');
  const [prBody, setPrBody] = useState('This pull request was automatically generated by Blueprint.ai.');
  const [prHead, setPrHead] = useState(activeBranch);
  const [prBase, setPrBase] = useState(defaultBranch);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`/api/github/commits?owner=${owner}&repo=${repo}&branch=${activeBranch}`)
      .catch(() => null);

    // Load PRs
    fetch(`/api/github/repos`)
      .then((r) => r.json())
      .then(() => {
        // We can't list PRs via the repos endpoint; we'll show a placeholder
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [owner, repo, activeBranch]);

  const createPR = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/github/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, branchName: prHead, baseBranch: prBase, title: prTitle, body: prBody }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Pull Request #${data.data.number} created!`);
        window.open(data.data.prUrl, '_blank');
        setShowCreate(false);
        setPulls((prev) => [
          ...prev,
          {
            number: data.data.number,
            title: prTitle,
            html_url: data.data.prUrl,
            state: 'open',
            head: prHead,
            base: prBase,
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        toast.error(data.error?.message || 'Failed to create pull request');
      }
    } catch {
      toast.error('Failed to create pull request');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">{pulls.length} pull request{pulls.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-400/30 bg-purple-400/10 px-3 py-1.5 text-xs font-bold text-purple-200 hover:bg-purple-400/20 transition"
        >
          <Plus className="h-3.5 w-3.5" /> New Pull Request
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createPR} className="rounded-xl border border-purple-400/30 bg-purple-950/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-white">Open a Pull Request</p>
            <button type="button" onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-white/40 uppercase font-bold block mb-1">head branch</label>
              <input value={prHead} onChange={(e) => setPrHead(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none" />
            </div>
            <span className="text-white/40 mt-4">→</span>
            <div className="flex-1">
              <label className="text-[10px] text-white/40 uppercase font-bold block mb-1">base branch</label>
              <input value={prBase} onChange={(e) => setPrBase(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/40 uppercase font-bold block mb-1">PR Title</label>
            <input value={prTitle} onChange={(e) => setPrTitle(e.target.value)} required className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none" />
          </div>

          <div>
            <label className="text-[10px] text-white/40 uppercase font-bold block mb-1">Description</label>
            <textarea value={prBody} onChange={(e) => setPrBody(e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none resize-none" />
          </div>

          <button type="submit" disabled={creating} className="w-full rounded-xl bg-purple-500 py-2.5 text-xs font-black text-white hover:bg-purple-400 disabled:opacity-50 transition">
            {creating ? 'Creating Pull Request...' : 'Open Pull Request on GitHub'}
          </button>
        </form>
      )}

      {pulls.length === 0 && !showCreate && (
        <div className="text-center py-10 rounded-xl border border-dashed border-white/10 text-xs text-white/30">
          <GitPullRequest className="h-8 w-8 mx-auto mb-2 text-white/20" />
          No pull requests created yet. Click <strong className="text-white">New Pull Request</strong> to open one on GitHub.
        </div>
      )}

      {pulls.map((pr) => (
        <div key={pr.number} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 hover:border-white/20 transition">
          <div className="flex items-center gap-3 min-w-0">
            <GitPullRequest className="h-4 w-4 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{pr.title}</p>
              <p className="text-xs text-white/40">#{pr.number} · {pr.head} → {pr.base} · {timeAgo(pr.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={pr.state} />
            <a href={pr.html_url} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-purple-300">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: HubTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: FaGithub },
  { id: 'branches', label: 'Branches', icon: GitBranch },
  { id: 'commits', label: 'Commits', icon: GitCommit },
  { id: 'files', label: 'Files', icon: FileCode2 },
  { id: 'diff', label: 'Diff', icon: Diff },
  { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest },
];

export default function ProjectGithubPage() {
  const { project } = useProject();
  const [activeTab, setActiveTab] = useState<HubTab>('overview');
  const [connectedRepo, setConnectedRepo] = useState<GithubRepo | null>(null);
  const [activeBranch, setActiveBranch] = useState('main');
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#05070a]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#090c12] px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10">
              <FaGithub className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">GitHub Integration</h1>
              <p className="text-xs text-white/40">
                {connectedRepo ? connectedRepo.full_name : `Connect a repository for ${project?.name}`}
              </p>
            </div>
          </div>

          {connectedRepo && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </span>
              <button
                onClick={() => setConnectedRepo(null)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/40 hover:text-white hover:bg-white/5 transition"
                title="Disconnect repository"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tab Bar (only when connected) */}
        {connectedRepo && (
          <div className="flex items-center gap-1 mt-5 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-white/10 text-cyan-200'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
        {!connectedRepo ? (
          <ConnectRepoPanel onConnected={(repo) => { setConnectedRepo(repo); setActiveBranch(repo.default_branch); }} />
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewPanel
                repo={connectedRepo}
                activeBranch={activeBranch}
                onPushFiles={() => setIsPushModalOpen(true)}
                projectFiles={project?.files || []}
                projectName={project?.name || 'Project'}
              />
            )}
            {activeTab === 'branches' && (
              <BranchesPanel
                owner={connectedRepo.owner}
                repo={connectedRepo.name}
                activeBranch={activeBranch}
                onSelectBranch={setActiveBranch}
              />
            )}
            {activeTab === 'commits' && (
              <CommitsPanel
                owner={connectedRepo.owner}
                repo={connectedRepo.name}
                branch={activeBranch}
              />
            )}
            {activeTab === 'files' && (
              <FilesPanel
                owner={connectedRepo.owner}
                repo={connectedRepo.name}
                branch={activeBranch}
              />
            )}
            {activeTab === 'diff' && (
              <DiffPanel
                owner={connectedRepo.owner}
                repo={connectedRepo.name}
                activeBranch={activeBranch}
                defaultBranch={connectedRepo.default_branch}
              />
            )}
            {activeTab === 'pulls' && (
              <PullsPanel
                owner={connectedRepo.owner}
                repo={connectedRepo.name}
                activeBranch={activeBranch}
                defaultBranch={connectedRepo.default_branch}
              />
            )}
          </>
        )}
      </div>

      {/* Push Modal */}
      <GithubModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        projectName={connectedRepo?.name || project?.name || ''}
        files={project?.files || []}
        onSuccess={(url) => toast.success(`Pushed to ${url}`)}
      />
    </div>
  );
}
