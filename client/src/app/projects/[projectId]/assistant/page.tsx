'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import {
  Brain, Cpu, FileCode2, Globe, Lock, AlertTriangle,
  Wrench, TestTube2, BookOpen, RefreshCw, Play, CheckCircle2,
  XCircle, Clock, ChevronRight, BarChart3, Layers, Shield,
  GitBranch, FileText, Search, Star, ArrowRight, Database,
  Zap, TrendingUp,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { GlassCard } from '@/components/GlassCard';
import { toast } from 'sonner';
import { cn } from '@/utils/utils';
import type {
  CodebaseAnalysisResult,
  AnalysisJob,
  TechnologyItem,
  SecurityFinding,
  TechnicalDebtItem,
  GapItem,
  ApiEndpoint,
  ImportantFile,
} from '@/validators/codebaseAnalysis';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ResultTab =
  | 'architecture'
  | 'technologies'
  | 'files'
  | 'api'
  | 'security'
  | 'debt'
  | 'testing'
  | 'docs';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-400 bg-red-950/40 border-red-500/30';
    case 'high': return 'text-orange-400 bg-orange-950/30 border-orange-500/30';
    case 'medium': return 'text-amber-400 bg-amber-950/30 border-amber-500/30';
    case 'low': return 'text-blue-400 bg-blue-950/30 border-blue-500/30';
    case 'info': return 'text-cyan-400 bg-cyan-950/30 border-cyan-500/30';
    default: return 'text-white/50 bg-white/5 border-white/10';
  }
}

function categoryIcon(category: string) {
  switch (category) {
    case 'language': return <FileCode2 className="h-3.5 w-3.5" />;
    case 'framework': return <Layers className="h-3.5 w-3.5" />;
    case 'database': return <Database className="h-3.5 w-3.5" />;
    case 'testing': return <TestTube2 className="h-3.5 w-3.5" />;
    case 'tool': return <Wrench className="h-3.5 w-3.5" />;
    case 'ci_cd': return <RefreshCw className="h-3.5 w-3.5" />;
    default: return <Globe className="h-3.5 w-3.5" />;
  }
}

function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', className)}>
      {label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  return <Badge label={severity} className={cn('shrink-0', severityColor(severity))} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Bar Panel
// ─────────────────────────────────────────────────────────────────────────────

function AnalysisProgress({ job }: { job: AnalysisJob }) {
  const isRunning = job.status === 'running';
  const isFailed = job.status === 'failed';

  return (
    <div className="rounded-2xl border border-white/10 bg-[#090c12] p-6 space-y-4">
      <div className="flex items-center gap-3">
        {isRunning ? (
          <Brain className="h-6 w-6 text-cyan-400 animate-pulse" />
        ) : isFailed ? (
          <XCircle className="h-6 w-6 text-red-400" />
        ) : (
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        )}
        <div>
          <p className="font-black text-white text-sm">
            {isRunning ? 'Analyzing Repository...' : isFailed ? 'Analysis Failed' : 'Analysis Complete'}
          </p>
          <p className="text-xs text-white/50">{job.progressMessage}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-white/40">
          <span>{job.owner}/{job.repo} @ {job.branch}</span>
          <span>{job.progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              isFailed ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500',
              isRunning && 'animate-pulse'
            )}
            style={{ width: `${job.progress}%` }}
          />
        </div>
      </div>

      {isFailed && job.error && (
        <div className="rounded-lg bg-red-950/40 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          Error: {job.error}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Result Section Panels
// ─────────────────────────────────────────────────────────────────────────────

function ArchitecturePanel({ data }: { data: CodebaseAnalysisResult }) {
  const { architectureSummary } = data;
  return (
    <div className="space-y-5">
      <GlassCard className="p-5 border-white/10">
        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2">Project Type</p>
        <p className="text-base font-black text-cyan-300">{architectureSummary.projectType}</p>
        <p className="mt-3 text-sm text-white/70 leading-relaxed">{architectureSummary.overview}</p>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-5 border-white/10">
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" /> Architecture Layers
          </p>
          <div className="space-y-2">
            {architectureSummary.layers.map((layer, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white">
                <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                {layer}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 border-white/10">
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" /> Design Patterns
          </p>
          <div className="flex flex-wrap gap-2">
            {architectureSummary.patterns.map((p, i) => (
              <span key={i} className="rounded-full border border-amber-500/30 bg-amber-950/20 px-3 py-1 text-xs text-amber-200">
                {p}
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5 border-white/10">
        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-emerald-400" /> Entry Points
        </p>
        <div className="space-y-1.5">
          {architectureSummary.entryPoints.map((ep, i) => (
            <p key={i} className="font-mono text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-500/20 rounded px-3 py-1.5">
              {ep}
            </p>
          ))}
        </div>
      </GlassCard>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Files Analyzed', value: data.filesAnalyzed, icon: FileText },
          { label: 'Total Files', value: data.totalFilesFound, icon: Search },
          { label: 'Tokens Used', value: data.tokensUsed.toLocaleString(), icon: Brain },
        ].map(({ label, value, icon: Icon }) => (
          <GlassCard key={label} className="p-4 border-white/10 text-center">
            <Icon className="h-5 w-5 text-white/30 mx-auto mb-1" />
            <p className="font-black text-white text-xl">{value}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{label}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function TechnologiesPanel({ data }: { data: CodebaseAnalysisResult }) {
  const grouped = data.technologyMap.reduce<Record<string, TechnologyItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([category, items]) => (
        <GlassCard key={category} className="p-5 border-white/10">
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
            {categoryIcon(category)}
            {category.replace('_', ' ')}
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((item, i) => (
              <div key={i} className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2',
                item.confidence === 'high' ? 'border-cyan-500/30 bg-cyan-950/20' :
                  item.confidence === 'medium' ? 'border-white/10 bg-white/5' :
                    'border-white/5 bg-white/[0.02]'
              )}>
                <span className="text-sm font-bold text-white">{item.name}</span>
                {item.version && <span className="text-[10px] text-white/40 font-mono">{item.version}</span>}
                <span className={cn('text-[9px] font-bold uppercase',
                  item.confidence === 'high' ? 'text-cyan-400' :
                    item.confidence === 'medium' ? 'text-white/40' : 'text-white/25'
                )}>{item.confidence}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function ImportantFilesPanel({ data }: { data: CodebaseAnalysisResult }) {
  const grouped = data.importantFiles.reduce<Record<string, ImportantFile[]>>((acc, f) => {
    if (!acc[f.priority]) acc[f.priority] = [];
    acc[f.priority].push(f);
    return acc;
  }, {});

  const priorityOrder = ['critical', 'high', 'medium', 'low'];

  return (
    <div className="space-y-4">
      {priorityOrder.filter((p) => grouped[p]?.length).map((priority) => (
        <div key={priority}>
          <div className="flex items-center gap-2 mb-2">
            {priority === 'critical' && <Star className="h-4 w-4 text-red-400" />}
            <p className={cn('text-xs font-bold uppercase tracking-widest', severityColor(priority).split(' ')[0])}>
              {priority}
            </p>
          </div>
          <div className="space-y-2">
            {grouped[priority].map((file, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                <FileCode2 className="h-4 w-4 text-white/30 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-mono text-xs text-cyan-200">{file.path}</p>
                  <p className="text-xs text-white/50 mt-0.5">{file.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ApiMapPanel({ data }: { data: CodebaseAnalysisResult }) {
  const methodColors: Record<string, string> = {
    GET: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    POST: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
    PUT: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
    PATCH: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
    DELETE: 'text-red-400 bg-red-950/40 border-red-500/30',
    ANY: 'text-white/50 bg-white/5 border-white/10',
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40">{data.apiMap.length} API endpoint{data.apiMap.length !== 1 ? 's' : ''} detected</p>
      {data.apiMap.map((ep: ApiEndpoint, i) => (
        <div key={i} className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
          <Badge label={ep.method} className={cn('shrink-0 mt-0.5', methodColors[ep.method] ?? methodColors.ANY)} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-mono text-sm text-white">{ep.path}</p>
              {ep.authenticated && (
                <span className="flex items-center gap-1 text-[10px] text-amber-300 border border-amber-500/30 bg-amber-950/20 rounded px-1.5 py-0.5">
                  <Lock className="h-2.5 w-2.5" /> Auth
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 mt-0.5">{ep.description}</p>
            <p className="font-mono text-[11px] text-white/30 mt-1">{ep.file}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FindingsList<T extends { severity: string; title?: string; description: string; file?: string; recommendation?: string; impact?: string; suggestion?: string; category?: string }>({
  items,
  emptyMessage,
}: {
  items: T[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl border border-dashed border-white/10 text-xs text-white/30">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-white/20" />
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="flex items-start gap-3 px-4 py-3">
            <SeverityBadge severity={item.severity} />
            <div className="min-w-0 flex-1">
              {item.title && <p className="font-semibold text-white text-sm">{item.title}</p>}
              {item.category && (
                <p className="text-[10px] uppercase font-bold text-white/30 mb-1">{item.category}</p>
              )}
              <p className="text-xs text-white/60 leading-relaxed">{item.description}</p>
              {item.file && (
                <p className="font-mono text-[11px] text-white/30 mt-1">{item.file}</p>
              )}
            </div>
          </div>
          {(item.recommendation || item.impact || item.suggestion) && (
            <div className="border-t border-white/5 bg-black/20 px-4 py-2.5">
              <p className="text-xs text-white/40">
                <span className="font-bold text-white/60">{item.recommendation ? 'Recommendation' : item.impact ? 'Impact' : 'Suggestion'}: </span>
                {item.recommendation || item.impact || item.suggestion}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Repository Setup Panel
// ─────────────────────────────────────────────────────────────────────────────

function SetupPanel({
  projectName,
  onStart,
  isStarting,
  pastJobs,
  onLoadJob,
}: {
  projectName: string;
  onStart: (owner: string, repo: string, branch: string) => void;
  isStarting: boolean;
  pastJobs: Omit<AnalysisJob, 'result'>[];
  onLoadJob: (jobId: string) => void;
}) {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [repos, setRepos] = useState<{ full_name: string; owner: string; name: string; default_branch: string }[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const loadRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await fetch('/api/github/repos');
      const data = await res.json();
      if (data.success) setRepos(data.data);
    } catch { toast.error('Failed to load repositories'); }
    finally { setLoadingRepos(false); }
  };

  const selectRepo = (r: typeof repos[0]) => {
    setOwner(r.owner);
    setRepo(r.name);
    setBranch(r.default_branch);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-cyan-400/30 bg-[#090c12] p-8 text-center">
        <Brain className="h-12 w-12 text-white/20 mx-auto mb-4" />
        <h2 className="text-lg font-black text-white mb-1">Codebase Intelligence Engine</h2>
        <p className="text-xs text-white/50 max-w-md mx-auto">
          Connect a GitHub repository and run deep AI-powered analysis across its full file structure.
          Generates Architecture Summary, Technology Map, API Map, Security Findings, and more.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#090c12] p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-white/50">Repository to Analyze</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Owner</label>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. octocat"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Repository</label>
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="e.g. my-project"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Branch</label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onStart(owner.trim(), repo.trim(), branch.trim() || 'main')}
            disabled={!owner.trim() || !repo.trim() || isStarting}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-black text-black hover:bg-cyan-300 disabled:opacity-40 transition shadow-[0_0_15px_rgba(0,243,255,0.2)]"
          >
            {isStarting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isStarting ? 'Starting Analysis...' : 'Run Intelligence Analysis'}
          </button>

          <button
            onClick={loadRepos}
            disabled={loadingRepos}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-40 transition"
          >
            {loadingRepos ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FaGithub className="h-4 w-4" />}
            Browse My Repos
          </button>
        </div>

        {repos.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1.5 pt-2 border-t border-white/10">
            {repos.map((r) => (
              <div
                key={r.full_name}
                onClick={() => selectRepo(r)}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition',
                  owner === r.owner && repo === r.name
                    ? 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-100'
                    : 'border border-transparent hover:bg-white/5 text-white/70'
                )}
              >
                <span className="font-mono">{r.full_name}</span>
                <span className="text-white/30">{r.default_branch}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Analyses */}
      {pastJobs.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
            <Clock className="h-3.5 w-3.5 inline mr-1.5" />Recent Analyses
          </p>
          <div className="space-y-2">
            {pastJobs.slice(0, 5).map((job) => (
              <div
                key={job.jobId}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 hover:border-white/20 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {job.status === 'complete' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : job.status === 'failed' ? (
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  ) : (
                    <RefreshCw className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-white truncate">{job.owner}/{job.repo}</p>
                    <p className="text-[11px] text-white/40">{job.branch} · {new Date(job.startedAt).toLocaleString()}</p>
                  </div>
                </div>
                {job.status === 'complete' && (
                  <button
                    onClick={() => onLoadJob(job.jobId)}
                    className="shrink-0 ml-4 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const RESULT_TABS: { id: ResultTab; label: string; icon: React.ElementType; badgeKey?: keyof CodebaseAnalysisResult }[] = [
  { id: 'architecture', label: 'Architecture', icon: Layers },
  { id: 'technologies', label: 'Technology Map', icon: Cpu, badgeKey: 'technologyMap' },
  { id: 'files', label: 'Important Files', icon: Star, badgeKey: 'importantFiles' },
  { id: 'api', label: 'API Map', icon: Globe, badgeKey: 'apiMap' },
  { id: 'security', label: 'Security', icon: Shield, badgeKey: 'securityFindings' },
  { id: 'debt', label: 'Tech Debt', icon: TrendingUp, badgeKey: 'technicalDebt' },
  { id: 'testing', label: 'Testing Gaps', icon: TestTube2, badgeKey: 'testingGaps' },
  { id: 'docs', label: 'Doc Gaps', icon: BookOpen, badgeKey: 'documentationGaps' },
];

export default function ProjectAssistantPage() {
  const { project } = useProject();
  const [phase, setPhase] = useState<'setup' | 'running' | 'result'>('setup');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<AnalysisJob | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CodebaseAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('architecture');
  const [isStarting, setIsStarting] = useState(false);
  const [pastJobs, setPastJobs] = useState<Omit<AnalysisJob, 'result'>[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Load past jobs on mount
  useEffect(() => {
    fetch('/api/analysis/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setPastJobs(d.data); })
      .catch(() => null);
  }, []);

  // Poll job status
  const pollJob = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/analysis/status?jobId=${jobId}`);
      const data = await res.json();
      if (!data.success) return;

      const job = data.data as AnalysisJob;
      setCurrentJob(job);

      if (job.status === 'complete') {
        setAnalysisResult(job.result ?? null);
        setPhase('result');
        if (pollRef.current) clearInterval(pollRef.current);
        setPastJobs((prev) => {
          const { result: _r, ...meta } = job;
          return [meta, ...prev.filter((j) => j.jobId !== jobId)];
        });
      } else if (job.status === 'failed') {
        setPhase('running'); // stays on running to show error
        if (pollRef.current) clearInterval(pollRef.current);
        toast.error('Analysis failed: ' + job.error);
      }
    } catch { /* network error — keep polling */ }
  }, []);

  const startAnalysis = async (owner: string, repo: string, branch: string) => {
    if (!owner || !repo) { toast.error('Owner and repository are required'); return; }

    setIsStarting(true);
    try {
      const res = await fetch('/api/analysis/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, branch, projectId: project?.id }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error || 'Failed to start analysis'); return; }

      const jobId = data.data.jobId;
      setActiveJobId(jobId);
      setPhase('running');
      setCurrentJob({
        jobId,
        owner,
        repo,
        branch,
        status: 'running',
        progress: 0,
        progressMessage: 'Analysis starting...',
        startedAt: new Date().toISOString(),
      });

      // Start polling every 2 seconds
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => pollJob(jobId), 2000);
    } catch {
      toast.error('Failed to start analysis');
    } finally {
      setIsStarting(false);
    }
  };

  const loadPastJob = async (jobId: string) => {
    const res = await fetch(`/api/analysis/status?jobId=${jobId}`);
    const data = await res.json();
    if (data.success && data.data.status === 'complete') {
      setCurrentJob(data.data);
      setAnalysisResult(data.data.result);
      setPhase('result');
      setActiveTab('architecture');
    }
  };

  // Cleanup poll on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <div className="min-h-screen bg-[#05070a]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#090c12] px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
              <Brain className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Codebase Intelligence Engine</h1>
              <p className="text-xs text-white/40">
                {currentJob ? `${currentJob.owner}/${currentJob.repo} @ ${currentJob.branch}` : `Deep AI analysis for ${project?.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {phase !== 'setup' && (
              <button
                onClick={() => { setPhase('setup'); setCurrentJob(null); setAnalysisResult(null); if (pollRef.current) clearInterval(pollRef.current); }}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/40 hover:text-white hover:bg-white/5 transition"
              >
                ← New Analysis
              </button>
            )}
            {phase === 'result' && analysisResult && (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Analysis Complete · {analysisResult.filesAnalyzed} files
              </div>
            )}
          </div>
        </div>

        {/* Result tab bar */}
        {phase === 'result' && analysisResult && (
          <div className="flex items-center gap-1 mt-5 overflow-x-auto">
            {RESULT_TABS.map((tab) => {
              const count = tab.badgeKey ? (analysisResult[tab.badgeKey] as unknown[])?.length ?? 0 : undefined;
              const hasCritical =
                tab.badgeKey &&
                ['securityFindings', 'technicalDebt', 'testingGaps', 'documentationGaps'].includes(tab.badgeKey) &&
                (analysisResult[tab.badgeKey] as { severity: string }[]).some((i) => i.severity === 'critical' || i.severity === 'high');

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-white/10 text-cyan-200'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-[9px] font-bold ml-0.5',
                      hasCritical ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white/50'
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
        {phase === 'setup' && (
          <SetupPanel
            projectName={project?.name || 'Project'}
            onStart={startAnalysis}
            isStarting={isStarting}
            pastJobs={pastJobs}
            onLoadJob={loadPastJob}
          />
        )}

        {phase === 'running' && currentJob && (
          <div className="max-w-2xl mx-auto space-y-6">
            <AnalysisProgress job={currentJob} />

            {/* Animated hint cards while running */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { icon: FileCode2, label: 'Filtering Files', desc: 'Skipping binaries, lock files, node_modules' },
                { icon: BarChart3, label: 'Token Budgeting', desc: 'Chunking code within LLM context limits' },
                { icon: Brain, label: 'AI Analysis', desc: 'Gemini 1.5 Flash analyzing code patterns' },
                { icon: Shield, label: 'Security Scan', desc: 'Checking for exposed secrets & vulnerabilities' },
                { icon: TestTube2, label: 'Test Coverage', desc: 'Identifying uncovered code paths' },
                { icon: BookOpen, label: 'Doc Audit', desc: 'Finding undocumented APIs & components' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-1.5">
                  <Icon className="h-5 w-5 text-white/30" />
                  <p className="text-xs font-bold text-white">{label}</p>
                  <p className="text-[11px] text-white/40">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'result' && analysisResult && (
          <>
            {activeTab === 'architecture' && <ArchitecturePanel data={analysisResult} />}
            {activeTab === 'technologies' && <TechnologiesPanel data={analysisResult} />}
            {activeTab === 'files' && <ImportantFilesPanel data={analysisResult} />}
            {activeTab === 'api' && <ApiMapPanel data={analysisResult} />}
            {activeTab === 'security' && (
              <FindingsList
                items={analysisResult.securityFindings}
                emptyMessage="No security issues detected. Your codebase looks clean!"
              />
            )}
            {activeTab === 'debt' && (
              <FindingsList
                items={analysisResult.technicalDebt}
                emptyMessage="No significant technical debt detected."
              />
            )}
            {activeTab === 'testing' && (
              <FindingsList
                items={analysisResult.testingGaps}
                emptyMessage="Great test coverage! No significant gaps detected."
              />
            )}
            {activeTab === 'docs' && (
              <FindingsList
                items={analysisResult.documentationGaps}
                emptyMessage="Documentation looks comprehensive! No gaps detected."
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
