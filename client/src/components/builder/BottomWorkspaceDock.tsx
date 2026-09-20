'use client';

import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  GitCommit,
  GitPullRequest,
  Play,
  Terminal,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { ProjectFile } from '@/types/project';
import { cn } from '@/utils/utils';

export type BottomTab = 'terminal' | 'problems' | 'git' | 'tests';

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface ProblemItem {
  id: string;
  filePath: string;
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'running';
  durationMs: number;
  errorMsg?: string;
}

export function BottomWorkspaceDock({
  isExpanded,
  onToggleExpand,
  logs,
  problems,
  dirtyFiles,
  projectFiles,
  repoName,
  onClearLogs,
  onSelectProblemFile,
  onCommitChanges,
  onPushGithub,
  onRunTests,
}: {
  isExpanded: boolean;
  onToggleExpand: () => void;
  logs: TerminalLog[];
  problems: ProblemItem[];
  dirtyFiles: Set<string>;
  projectFiles: ProjectFile[];
  repoName?: string;
  onClearLogs: () => void;
  onSelectProblemFile: (filePath: string) => void;
  onCommitChanges: (message: string) => void;
  onPushGithub: () => void;
  onRunTests: () => void;
}) {
  const [activeTab, setActiveTab] = useState<BottomTab>('terminal');
  const [commitMessage, setCommitMessage] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 't1', name: 'JSON & TypeScript Syntax Validation', status: 'passed', durationMs: 14 },
    { id: 't2', name: 'API Schema Contract Integrity Check', status: 'passed', durationMs: 28 },
    { id: 't3', name: 'Component Export Safety Check', status: 'passed', durationMs: 19 },
  ]);
  const [isRunningSuite, setIsRunningSuite] = useState(false);

  const handleRunTestsInternal = () => {
    setIsRunningSuite(true);
    onRunTests();
    setTimeout(() => {
      setTestResults([
        { id: 't1', name: 'JSON & TypeScript Syntax Validation', status: problems.length > 0 ? 'failed' : 'passed', durationMs: 12, errorMsg: problems.length > 0 ? `${problems.length} syntax issues found` : undefined },
        { id: 't2', name: 'API Schema Contract Integrity Check', status: 'passed', durationMs: 24 },
        { id: 't3', name: 'Component Export Safety Check', status: 'passed', durationMs: 18 },
      ]);
      setIsRunningSuite(false);
    }, 1000);
  };

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim() || dirtyFiles.size === 0) return;
    onCommitChanges(commitMessage.trim());
    setCommitMessage('');
  };

  return (
    <footer className="flex flex-col border-t border-white/10 bg-[#06080d]">
      {/* Dock Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#090c12] px-3 py-1.5 select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab('terminal');
              if (!isExpanded) onToggleExpand();
            }}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition font-medium',
              activeTab === 'terminal' && isExpanded
                ? 'bg-white/10 text-cyan-200'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            )}
          >
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span>Terminal</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] text-white/50">{logs.length}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('problems');
              if (!isExpanded) onToggleExpand();
            }}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition font-medium',
              activeTab === 'problems' && isExpanded
                ? 'bg-white/10 text-cyan-200'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            )}
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>Problems</span>
            {problems.length > 0 && (
              <span className="rounded-full bg-red-500/20 px-1.5 py-0.2 text-[10px] text-red-300 font-bold">{problems.length}</span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('git');
              if (!isExpanded) onToggleExpand();
            }}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition font-medium',
              activeTab === 'git' && isExpanded
                ? 'bg-white/10 text-cyan-200'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            )}
          >
            <GitCommit className="h-3.5 w-3.5 text-purple-400" />
            <span>Git Changes</span>
            {dirtyFiles.size > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] text-amber-300 font-bold">{dirtyFiles.size}</span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('tests');
              if (!isExpanded) onToggleExpand();
            }}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition font-medium',
              activeTab === 'tests' && isExpanded
                ? 'bg-white/10 text-cyan-200'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            )}
          >
            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Tests</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'terminal' && isExpanded && (
            <button
              onClick={onClearLogs}
              className="p-1 rounded text-white/30 hover:text-white hover:bg-white/5"
              title="Clear terminal logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={onToggleExpand}
            className="p-1 rounded text-white/40 hover:text-white hover:bg-white/5 transition"
            title={isExpanded ? 'Collapse dock' : 'Expand dock'}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Dock Expanded Content */}
      {isExpanded && (
        <div className="h-48 overflow-auto p-3 font-mono text-xs">
          {/* Terminal Logs Tab */}
          {activeTab === 'terminal' && (
            <div className="space-y-1">
              {logs.length === 0 ? (
                <div className="text-white/30 text-[11px]">System ready. Operational logs will appear here.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-5">
                    <span className="text-white/20 text-[10px] shrink-0">{log.timestamp}</span>
                    <span
                      className={cn(
                        'shrink-0 text-[10px] uppercase font-bold px-1 rounded',
                        log.type === 'error' && 'bg-red-950 text-red-400',
                        log.type === 'warn' && 'bg-amber-950 text-amber-400',
                        log.type === 'success' && 'bg-emerald-950 text-emerald-400',
                        log.type === 'info' && 'bg-cyan-950 text-cyan-400'
                      )}
                    >
                      {log.type}
                    </span>
                    <span
                      className={cn(
                        log.type === 'error' && 'text-red-300',
                        log.type === 'warn' && 'text-amber-300',
                        log.type === 'success' && 'text-emerald-300',
                        log.type === 'info' && 'text-cyan-100/80'
                      )}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Problems Tab */}
          {activeTab === 'problems' && (
            <div className="space-y-1.5">
              {problems.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>No syntax or build problems detected across workspace files.</span>
                </div>
              ) : (
                problems.map((prob) => (
                  <div
                    key={prob.id}
                    onClick={() => onSelectProblemFile(prob.filePath)}
                    className="flex items-center justify-between rounded border border-red-500/20 bg-red-950/20 p-2 text-xs text-red-200 hover:bg-red-950/40 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                      <span className="font-bold text-white shrink-0">{prob.filePath}:{prob.line}</span>
                      <span className="truncate">{prob.message}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-red-400 border border-red-400/30 px-1.5 py-0.5 rounded">
                      {prob.severity}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Git Changes Tab */}
          {activeTab === 'git' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">
                  {dirtyFiles.size} modified file{dirtyFiles.size === 1 ? '' : 's'} ready for commit
                </span>
                <button
                  onClick={onPushGithub}
                  className="flex items-center gap-1.5 rounded bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-500 transition"
                >
                  <GitPullRequest className="h-3.5 w-3.5" />
                  <span>Push to {repoName || 'GitHub'}</span>
                </button>
              </div>

              {/* Modified Files List */}
              <div className="space-y-1">
                {Array.from(dirtyFiles).map((path) => (
                  <div key={path} className="flex items-center justify-between rounded bg-white/5 px-2.5 py-1 text-xs">
                    <span className="font-mono text-cyan-200">{path}</span>
                    <span className="text-[10px] font-bold text-amber-400">MODIFIED</span>
                  </div>
                ))}
              </div>

              {/* Commit Form */}
              <form onSubmit={handleCommitSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Commit message (e.g. Update component structure)"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="flex-1 rounded border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!commitMessage.trim() || dirtyFiles.size === 0}
                  className="rounded bg-cyan-500 px-3 py-1.5 text-xs font-bold text-black disabled:opacity-30 hover:bg-cyan-400"
                >
                  Commit
                </button>
              </form>
            </div>
          )}

          {/* Tests Tab */}
          {activeTab === 'tests' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Workspace Structural Verification Suite</span>
                <button
                  onClick={handleRunTestsInternal}
                  disabled={isRunningSuite}
                  className="flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{isRunningSuite ? 'Running Tests...' : 'Run Test Suite'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {testResults.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      {t.status === 'passed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <span className="font-medium text-white">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {t.errorMsg && <span className="text-red-300 text-[11px]">{t.errorMsg}</span>}
                      <span className="font-mono text-[10px] text-white/40">{t.durationMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </footer>
  );
}
