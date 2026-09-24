'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2,
  RefreshCw, Play, Clock, Search, GitPullRequest, GitCommit,
  FileCode2, Bug, Lock, Layers, Zap, XCircle, Check, X,
  FileText, Shield, TestTube2, AlertCircle, ExternalLink, Filter
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { GlassCard } from '@/components/GlassCard';
import { toast } from 'sonner';
import { cn } from '@/utils/utils';
import type { ReviewJob, CodeReviewResult, ReviewFinding, FindingStatus, ReviewCategory } from '@/validators/codeReview';

type TargetType = 'repository' | 'pull_request' | 'commit' | 'selected_files';

const CATEGORIES: ReviewCategory[] = [
  'Security', 'Bug', 'Performance', 'Architecture', 'Maintainability', 'Code Quality', 'Testing'
];

function severityBadge(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'medium': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    default: return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  }
}

function riskBadge(risk: string) {
  switch (risk) {
    case 'CRITICAL': return 'bg-red-500/20 text-red-300 border-red-500/40';
    case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    case 'MEDIUM': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    default: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function ProjectCodeReviewPage() {
  const { project } = useProject();
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [targetType, setTargetType] = useState<TargetType>('repository');
  const [prNumber, setPrNumber] = useState<number | ''>('');
  const [commitSha, setCommitSha] = useState('');
  const [filePathsStr, setFilePathsStr] = useState('');

  const [isStarting, setIsStarting] = useState(false);
  const [currentJob, setCurrentJob] = useState<ReviewJob | null>(null);
  const [result, setResult] = useState<CodeReviewResult | null>(null);
  const [findings, setFindings] = useState<ReviewFinding[]>([]);

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [pastJobs, setPastJobs] = useState<Omit<ReviewJob, 'result'>[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/reviews/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setPastJobs(d.data); })
      .catch(() => null);
  }, []);

  const pollJob = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/reviews/status?jobId=${jobId}`);
      const data = await res.json();
      if (!data.success) return;
      const job = data.data as ReviewJob;
      setCurrentJob(job);

      if (job.status === 'complete') {
        setResult(job.result ?? null);
        setFindings(job.result?.findings ?? []);
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (job.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current);
        toast.error('Code review failed: ' + job.error);
      }
    } catch {
      // ignore network polling errors
    }
  }, []);

  const startReview = async () => {
    if (!owner.trim() || !repo.trim()) {
      toast.error('Owner and Repository name are required');
      return;
    }
    setIsStarting(true);
    try {
      const payload: Record<string, unknown> = {
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || 'main',
        targetType,
        projectId: project?.id,
      };

      if (targetType === 'pull_request' && prNumber) payload.prNumber = Number(prNumber);
      if (targetType === 'commit' && commitSha) payload.commitSha = commitSha.trim();
      if (targetType === 'selected_files' && filePathsStr) {
        payload.filePaths = filePathsStr.split(',').map((s) => s.trim()).filter(Boolean);
      }

      const res = await fetch('/api/reviews/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error?.message || 'Failed to start review');
        return;
      }
      const jobId = data.data.jobId;
      setCurrentJob({
        jobId,
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || 'main',
        targetType,
        status: 'running',
        progress: 0,
        progressMessage: 'Initiating AI security & code audit...',
        startedAt: new Date().toISOString(),
      });
      setResult(null);
      setFindings([]);

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => pollJob(jobId), 2000);
    } catch {
      toast.error('Failed to initiate code review');
    } finally {
      setIsStarting(false);
    }
  };

  const updateFindingStatus = async (findingId: string, newStatus: FindingStatus) => {
    if (!currentJob?.jobId) return;

    // Optimistic UI update
    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, status: newStatus } : f))
    );

    try {
      const res = await fetch('/api/reviews/finding-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: currentJob.jobId,
          findingId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Finding marked as ${newStatus}`);
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Failed to update finding status');
    }
  };

  const loadPastJob = async (jobId: string) => {
    const res = await fetch(`/api/reviews/status?jobId=${jobId}`);
    const data = await res.json();
    if (data.success && data.data.status === 'complete') {
      setCurrentJob(data.data);
      setResult(data.data.result);
      setFindings(data.data.result?.findings ?? []);
    }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const filteredFindings = findings.filter((f) => {
    const matchSev = filterSeverity === 'ALL' || f.severity.toUpperCase() === filterSeverity;
    const matchCat = filterCategory === 'ALL' || f.category === filterCategory;
    const matchStat = filterStatus === 'ALL' || f.status === filterStatus;
    return matchSev && matchCat && matchStat;
  });

  const openCount = findings.filter((f) => f.status === 'OPEN').length;
  const resolvedCount = findings.filter((f) => f.status === 'RESOLVED').length;
  const dismissedCount = findings.filter((f) => f.status === 'DISMISSED').length;

  return (
    <div className="min-h-screen bg-[#05070a] p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="border-b border-white/10 pb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-cyan-400" />
              AI Code Review Engine
            </h1>
            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              Advisory · Non-Destructive
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Analyze code, commits, and Pull Requests across Security, Bugs, Performance, Architecture, Maintainability, Quality & Testing
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-3">
            <span className={cn('rounded-xl border px-3 py-1.5 text-xs font-black uppercase', riskBadge(result.riskAssessment))}>
              PR Risk: {result.riskAssessment}
            </span>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-black text-emerald-400">
              <ShieldCheck className="h-4 w-4" /> Score: {result.overallScore}/100
            </div>
          </div>
        )}
      </div>

      {/* Audit Target Configurator */}
      <GlassCard className="p-6 border-white/10 space-y-5">
        {/* Target Type Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 flex-wrap">
          <span className="text-xs font-bold text-white/40 uppercase tracking-wider mr-2">Audit Scope:</span>
          {[
            { id: 'repository', label: 'Full Repository', icon: FaGithub },
            { id: 'pull_request', label: 'Pull Request', icon: GitPullRequest },
            { id: 'commit', label: 'Commit Diff', icon: GitCommit },
            { id: 'selected_files', label: 'Selected Files', icon: FileCode2 },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTargetType(t.id as TargetType)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition border',
                targetType === t.id
                  ? 'bg-cyan-400/20 border-cyan-400/40 text-cyan-200'
                  : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Dynamic Inputs based on Target */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Owner</label>
            <input
              type="text"
              placeholder="e.g. Ritu-7"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Repository</label>
            <input
              type="text"
              placeholder="e.g. Blueprint.ai"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Branch</label>
            <input
              type="text"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {targetType === 'pull_request' && (
            <div>
              <label className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">PR Number</label>
              <input
                type="number"
                placeholder="e.g. 1"
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-lg border border-cyan-500/40 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          )}

          {targetType === 'commit' && (
            <div>
              <label className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Commit SHA</label>
              <input
                type="text"
                placeholder="e.g. a1b2c3d"
                value={commitSha}
                onChange={(e) => setCommitSha(e.target.value)}
                className="w-full rounded-lg border border-cyan-500/40 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          )}

          {targetType === 'selected_files' && (
            <div>
              <label className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Files (comma separated)</label>
              <input
                type="text"
                placeholder="src/app/page.tsx, src/lib/auth.ts"
                value={filePathsStr}
                onChange={(e) => setFilePathsStr(e.target.value)}
                className="w-full rounded-lg border border-cyan-500/40 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          )}
        </div>

        <button
          onClick={startReview}
          disabled={isStarting || currentJob?.status === 'running'}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-black text-black hover:bg-cyan-300 disabled:opacity-50 transition shadow-[0_0_15px_rgba(0,243,255,0.2)]"
        >
          {isStarting || currentJob?.status === 'running' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run {targetType.replace('_', ' ').toUpperCase()} Review
        </button>
      </GlassCard>

      {/* Progress View */}
      {currentJob && currentJob.status === 'running' && (
        <GlassCard className="p-6 border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-cyan-400 animate-spin" />
            <div>
              <p className="font-bold text-white text-sm">Reviewing Codebase & PR Changes...</p>
              <p className="text-xs text-white/50">{currentJob.progressMessage}</p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
              style={{ width: `${currentJob.progress}%` }}
            />
          </div>
        </GlassCard>
      )}

      {/* Audit Results Dashboard */}
      {result && (
        <div className="space-y-6">
          {/* PR Summary & Risk Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="p-6 border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Risk Assessment</span>
                <span className={cn('rounded-lg border px-3 py-1 text-xs font-black uppercase', riskBadge(result.riskAssessment))}>
                  {result.riskAssessment}
                </span>
              </div>
              <div className="text-center py-3">
                <span className={cn('text-6xl font-black', scoreColor(result.overallScore))}>{result.overallScore}</span>
                <p className="text-xs text-white/40 mt-1">Quality Score / 100</p>
              </div>
              <div className="flex justify-around text-center pt-3 border-t border-white/10 text-xs">
                <div><p className="font-black text-amber-400">{openCount}</p><p className="text-[10px] text-white/40">OPEN</p></div>
                <div><p className="font-black text-emerald-400">{resolvedCount}</p><p className="text-[10px] text-white/40">RESOLVED</p></div>
                <div><p className="font-black text-white/30">{dismissedCount}</p><p className="text-[10px] text-white/40">DISMISSED</p></div>
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-2 p-6 border-white/10 space-y-4">
              <h3 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <GitPullRequest className="h-4 w-4 text-cyan-400" /> Executive PR & Change Summary
              </h3>
              <p className="text-xs text-white/80 leading-relaxed bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                {result.prSummary}
              </p>

              {/* 7 Category Ratings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {Object.entries(result.categories).map(([cat, score]) => (
                  <div key={cat} className="rounded-lg border border-white/5 bg-black/40 p-2.5">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-white/60 capitalize">{cat}</span>
                      <span className={scoreColor(score)}>{score}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mt-1.5">
                      <div className={cn('h-full rounded-full', scoreBg(score))} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Interactive Findings List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bug className="h-5 w-5 text-amber-400" /> Review Findings ({filteredFindings.length})
              </h3>

              {/* Multi Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0a0d14] px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0a0d14] px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open ({openCount})</option>
                  <option value="RESOLVED">Resolved ({resolvedCount})</option>
                  <option value="DISMISSED">Dismissed ({dismissedCount})</option>
                </select>

                {/* Severity Filter */}
                <div className="flex gap-1">
                  {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setFilterSeverity(sev)}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase transition border',
                        filterSeverity === sev
                          ? 'bg-cyan-400/20 border-cyan-400/40 text-cyan-200'
                          : 'border-transparent text-white/30 hover:text-white/60'
                      )}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Findings Cards */}
            <div className="grid gap-3">
              {filteredFindings.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-white/10 text-xs text-white/30">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400/50" />
                  No review findings match your active filters.
                </div>
              ) : (
                filteredFindings.map((finding) => (
                  <GlassCard
                    key={finding.id}
                    className={cn(
                      'p-5 border-white/10 space-y-3 transition',
                      finding.status === 'RESOLVED' && 'opacity-60 border-emerald-500/20',
                      finding.status === 'DISMISSED' && 'opacity-40 border-white/5'
                    )}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('rounded px-2 py-0.5 text-[10px] font-black uppercase border', severityBadge(finding.severity))}>
                          {finding.severity}
                        </span>
                        <span className="text-xs font-bold text-white/60 border border-white/10 rounded px-2 py-0.5 bg-white/5">
                          {finding.category}
                        </span>
                        <h4 className="font-bold text-white text-sm">{finding.title}</h4>
                      </div>

                      {/* Interactive Status Toggle Buttons */}
                      <div className="flex items-center gap-1 border border-white/10 rounded-lg p-0.5 bg-black/40">
                        {(['OPEN', 'RESOLVED', 'DISMISSED'] as FindingStatus[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => updateFindingStatus(finding.id, st)}
                            className={cn(
                              'rounded px-2.5 py-1 text-[10px] font-bold uppercase transition',
                              finding.status === st
                                ? st === 'OPEN' ? 'bg-amber-500/30 text-amber-200'
                                  : st === 'RESOLVED' ? 'bg-emerald-500/30 text-emerald-200'
                                    : 'bg-white/20 text-white/60'
                                : 'text-white/30 hover:text-white'
                            )}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-white/70 leading-relaxed">{finding.description}</p>

                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5">
                      <span className="font-mono text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-2.5 py-1 rounded">
                        File: {finding.file} {finding.line ? `(Line ${finding.line})` : ''}
                      </span>
                      <div className="text-xs text-emerald-300 font-mono flex-1 min-w-0 ml-4">
                        <strong className="text-white/40 uppercase">Recommendation: </strong>
                        {finding.recommendation}
                      </div>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          </div>

          {/* Test Recommendations */}
          {result.testRecommendations && result.testRecommendations.length > 0 && (
            <GlassCard className="p-6 border-white/10 space-y-3">
              <h3 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <TestTube2 className="h-4 w-4 text-purple-400" /> Recommended Test Coverage Additions
              </h3>
              <div className="space-y-2">
                {result.testRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-white/80 bg-purple-950/20 border border-purple-500/20 rounded-lg px-3.5 py-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* History */}
      {pastJobs.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Audit History</h3>
          <div className="grid gap-2">
            {pastJobs.map((j) => (
              <div key={j.jobId} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-mono text-white">{j.owner}/{j.repo} ({j.targetType})</span>
                  <span className="text-white/40">{new Date(j.startedAt).toLocaleString()}</span>
                </div>
                <button onClick={() => loadPastJob(j.jobId)} className="text-cyan-400 hover:text-cyan-300 font-bold">
                  View Results →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
