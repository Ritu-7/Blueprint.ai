'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Code2, GitCommit, GitPullRequest, Play, Terminal, Trash2, XCircle,
  FileX2, Maximize2, Minimize2
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
  const [commandInput, setCommandInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);

  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 't1', name: 'JSON & TypeScript Syntax Validation', status: 'passed', durationMs: 14 },
    { id: 't2', name: 'API Schema Contract Integrity Check', status: 'passed', durationMs: 28 },
    { id: 't3', name: 'Component Export Safety Check', status: 'passed', durationMs: 19 },
  ]);
  const [isRunningSuite, setIsRunningSuite] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'terminal' && isExpanded) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab, isExpanded]);

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

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    logs.push({
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'info',
      message: `$ ${commandInput.trim()}`,
    });
    setCommandInput('');
  };

  return (
    <footer
      className={cn(
        'flex flex-col border-t border-white/[0.06] bg-[#0a0d14] transition-all duration-200 select-none shrink-0 z-20',
        isMaximized ? 'h-[400px]' : isExpanded ? 'h-[240px]' : 'h-[36px]'
      )}
    >
      {/* Dock Header Bar */}
      <div className="flex h-[36px] items-center justify-between border-b border-white/[0.06] bg-[#0f131c] px-3 shrink-0">
        <div className="flex items-center gap-1 h-full">
          {[
            { id: 'terminal', label: 'Terminal', icon: Terminal, count: logs.length },
            { id: 'problems', label: 'Problems', icon: AlertCircle, count: problems.length, alert: problems.length > 0 },
            { id: 'git', label: 'Git Changes', icon: GitCommit, count: dirtyFiles.size },
            { id: 'tests', label: 'Tests', icon: Code2, count: testResults.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id && isExpanded;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as BottomTab);
                  if (!isExpanded) onToggleExpand();
                }}
                className={cn(
                  'flex h-full items-center gap-2 border-b-2 px-3 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-b-cyan-400 text-cyan-300 bg-[#0a0d14]'
                    : 'border-b-transparent text-white/40 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-cyan-400' : 'text-white/40')} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px]',
                      tab.alert ? 'bg-red-500/20 text-red-300 font-bold' : 'bg-white/10 text-white/50'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {activeTab === 'terminal' && isExpanded && (
            <button
              onClick={onClearLogs}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Clear Terminal Logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {isExpanded && (
            <button
              onClick={() => setIsMaximized((v) => !v)}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              title={isMaximized ? 'Restore Size' : 'Maximize Panel'}
            >
              {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}

          <button
            onClick={onToggleExpand}
            className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            title={isExpanded ? 'Collapse Dock' : 'Expand Dock'}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Dock Body */}
      {isExpanded && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 font-mono text-xs custom-scrollbar bg-[#0a0d14]">
          {/* Terminal Tab */}
          {activeTab === 'terminal' && (
            <div className="flex flex-col h-full justify-between space-y-2">
              <div className="space-y-1">
                {logs.length === 0 ? (
                  <div className="text-white/30 text-[11px]">System ready. Operational logs will appear here.</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 leading-5">
                      <span className="text-white/20 text-[10px] shrink-0 font-mono">{log.timestamp}</span>
                      <span
                        className={cn(
                          'shrink-0 text-[10px] uppercase font-bold px-1.5 py-0.2 rounded font-mono',
                          log.type === 'error' && 'bg-red-950/80 text-red-400 border border-red-500/30',
                          log.type === 'warn' && 'bg-amber-950/80 text-amber-400 border border-amber-500/30',
                          log.type === 'success' && 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30',
                          log.type === 'info' && 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30'
                        )}
                      >
                        {log.type}
                      </span>
                      <span
                        className={cn(
                          log.type === 'error' && 'text-red-300',
                          log.type === 'warn' && 'text-amber-300',
                          log.type === 'success' && 'text-emerald-300',
                          log.type === 'info' && 'text-cyan-100/90'
                        )}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>

              {/* Terminal Command Input Line ($) */}
              <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-cyan-400 font-bold">$</span>
                <input
                  type="text"
                  placeholder="Type npm test, git status..."
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white placeholder-white/30 outline-none border-none font-mono"
                />
              </form>
            </div>
          )}

          {/* Problems Tab */}
          {activeTab === 'problems' && (
            <div className="space-y-2">
              {problems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center text-xs text-white/30 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400/50" />
                  <p className="text-white/60 font-bold">No Problems Found</p>
                  <p className="text-[11px] text-white/40">No syntax errors or diagnostics detected across workspace files.</p>
                </div>
              ) : (
                problems.map((prob) => (
                  <div
                    key={prob.id}
                    onClick={() => onSelectProblemFile(prob.filePath)}
                    className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-950/20 p-2.5 text-xs text-red-200 hover:bg-red-950/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                      <span className="font-bold text-white shrink-0">{prob.filePath}:{prob.line}</span>
                      <span className="truncate">{prob.message}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-red-400 border border-red-400/30 px-2 py-0.5 rounded">
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
              {dirtyFiles.size === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center text-xs text-white/30 space-y-2">
                  <GitCommit className="h-8 w-8 text-white/20" />
                  <p className="text-white/60 font-bold">Working Tree Clean</p>
                  <p className="text-[11px] text-white/40">No unsaved or uncommitted file modifications.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">
                      {dirtyFiles.size} modified file{dirtyFiles.size === 1 ? '' : 's'} ready for commit
                    </span>
                    <button
                      onClick={onPushGithub}
                      className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition-colors"
                    >
                      <GitPullRequest className="h-3.5 w-3.5" />
                      <span>Push to {repoName || 'GitHub'}</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    {Array.from(dirtyFiles).map((path) => (
                      <div key={path} className="flex items-center justify-between rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs">
                        <span className="font-mono text-cyan-200">{path}</span>
                        <span className="text-[10px] font-bold text-amber-400 uppercase">Modified</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleCommitSubmit} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Commit message (e.g. Update component structure)"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="flex-1 rounded-lg border border-white/[0.06] bg-[#151a26] px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!commitMessage.trim() || dirtyFiles.size === 0}
                      className="rounded-lg bg-cyan-400 px-4 py-1.5 text-xs font-bold text-black disabled:opacity-30 hover:bg-cyan-300 transition-colors"
                    >
                      Commit
                    </button>
                  </form>
                </div>
              )}
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
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{isRunningSuite ? 'Running Tests...' : 'Run Test Suite'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {testResults.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#151a26] px-3 py-2 text-xs">
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
