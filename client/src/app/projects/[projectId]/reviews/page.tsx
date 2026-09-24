'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2,
  RefreshCw, Play, Clock, Search, ExternalLink, ChevronRight,
  Sparkles, FileCode2, Bug, Lock, Layers, Zap, XCircle
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { GlassCard } from '@/components/GlassCard';
import { toast } from 'sonner';
import { cn } from '@/utils/utils';
import type { ReviewJob, CodeReviewResult, ReviewFinding } from '@/validators/codeReview';

function severityBadge(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'medium': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    default: return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
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
  const [isStarting, setIsStarting] = useState(false);
  const [currentJob, setCurrentJob] = useState<ReviewJob | null>(null);
  const [result, setResult] = useState<CodeReviewResult | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
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
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (job.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current);
        toast.error('Code review failed: ' + job.error);
      }
    } catch {
      // ignore network errors
    }
  }, []);

  const startReview = async () => {
    if (!owner.trim() || !repo.trim()) {
      toast.error('Owner and Repository name are required');
      return;
    }
    setIsStarting(true);
    try {
      const res = await fetch('/api/reviews/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: owner.trim(),
          repo: repo.trim(),
          branch: branch.trim() || 'main',
          projectId: project?.id,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error?.message || 'Failed to start code review');
        return;
      }
      const jobId = data.data.jobId;
      setCurrentJob({
        jobId,
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || 'main',
        status: 'running',
        progress: 0,
        progressMessage: 'Initializing security audit...',
        startedAt: new Date().toISOString(),
      });
      setResult(null);

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => pollJob(jobId), 2000);
    } catch {
      toast.error('Failed to initiate code review');
    } finally {
      setIsStarting(false);
    }
  };

  const loadPastJob = async (jobId: string) => {
    const res = await fetch(`/api/reviews/status?jobId=${jobId}`);
    const data = await res.json();
    if (data.success && data.data.status === 'complete') {
      setCurrentJob(data.data);
      setResult(data.data.result);
    }
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const filteredFindings = (result?.findings || []).filter(
    (f) => filterSeverity === 'ALL' || f.severity.toUpperCase() === filterSeverity
  );

  return (
    <div className="min-h-screen bg-[#05070a] p-6 lg:p-8 space-y-6">
      {/* Top Bar */}
      <div className="border-b border-white/10 pb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-cyan-400" />
            AI Code Review & Security Audit
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Automated quality, vulnerability, and maintainability audit for {project?.name}
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-black text-emerald-400">
            <ShieldCheck className="h-4 w-4" /> Overall Score: {result.overallScore}/100
          </div>
        )}
      </div>

      {/* Setup Form Card */}
      <GlassCard className="p-6 border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FaGithub className="h-4 w-4 text-cyan-400" /> Audit GitHub Repository
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={startReview}
            disabled={isStarting || currentJob?.status === 'running'}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-black hover:bg-cyan-300 disabled:opacity-50 transition shadow-[0_0_15px_rgba(0,243,255,0.2)]"
          >
            {isStarting || currentJob?.status === 'running' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run AI Code Review
          </button>
        </div>
      </GlassCard>

      {/* Progress View */}
      {currentJob && currentJob.status === 'running' && (
        <GlassCard className="p-6 border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-cyan-400 animate-spin" />
            <div>
              <p className="font-bold text-white text-sm">Reviewing Codebase...</p>
              <p className="text-xs text-white/50">{currentJob.progressMessage}</p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-500"
              style={{ width: `${currentJob.progress}%` }}
            />
          </div>
        </GlassCard>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Executive Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="p-6 border-white/10 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Overall Quality Score</span>
              <span className={cn('text-6xl font-black', scoreColor(result.overallScore))}>{result.overallScore}</span>
              <span className="text-xs text-white/50">out of 100</span>
            </GlassCard>

            <GlassCard className="lg:col-span-2 p-6 border-white/10 space-y-4">
              <h3 className="font-black text-white text-sm uppercase tracking-wider">Category Performance</h3>
              <div className="space-y-3">
                {Object.entries(result.categories).map(([cat, score]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white/70 capitalize">{cat.replace(/([A-Z])/g, ' $1')}</span>
                      <span className={scoreColor(score)}>{score}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-700', scoreBg(score))} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-6 border-white/10 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Executive Summary</h3>
            <p className="text-sm text-white/80 leading-relaxed">{result.summary}</p>
          </GlassCard>

          {/* Audit Findings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bug className="h-5 w-5 text-amber-400" /> Code Audit Findings ({filteredFindings.length})
              </h3>
              <div className="flex gap-1">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => (
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

            <div className="grid gap-3">
              {filteredFindings.map((finding) => (
                <GlassCard key={finding.id} className="p-4 border-white/10 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded px-2 py-0.5 text-[10px] font-black uppercase border', severityBadge(finding.severity))}>
                        {finding.severity}
                      </span>
                      <span className="text-xs font-bold text-white/50 border border-white/10 rounded px-2 py-0.5">{finding.category}</span>
                      <h4 className="font-bold text-white text-sm">{finding.title}</h4>
                    </div>
                    {finding.file && (
                      <span className="font-mono text-[11px] text-cyan-300 bg-cyan-950/30 border border-cyan-500/20 px-2 py-0.5 rounded">
                        {finding.file} {finding.lineHint ? `(${finding.lineHint})` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{finding.description}</p>
                  <div className="rounded bg-black/40 border border-white/5 p-2.5 text-xs text-emerald-300/90 font-mono">
                    <span className="font-bold text-white/40">Fix Suggestion: </span>
                    {finding.suggestion}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Past Audits */}
      {pastJobs.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Past Audit History</h3>
          <div className="grid gap-2">
            {pastJobs.map((j) => (
              <div key={j.jobId} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-mono text-white">{j.owner}/{j.repo} ({j.branch})</span>
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
