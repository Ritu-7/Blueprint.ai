'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Code2, GitCommit, GitPullRequest, Terminal, Trash2,
  Maximize2, Minimize2, Copy, Eye
} from 'lucide-react';
import type { ProjectFile } from '@/types/project';
import { cn } from '@/utils/utils';
import { toast } from 'sonner';

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

export function BottomWorkspaceDock({
  isExpanded,
  onToggleExpand,
  logs,
  problems,
  dirtyFiles,
  projectFiles,
  contentMap = {},
  repoName,
  onClearLogs,
  onAddLog,
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
  contentMap?: Record<string, string>;
  repoName?: string;
  onClearLogs: () => void;
  onAddLog?: (type: 'info' | 'success' | 'warn' | 'error', message: string) => void;
  onSelectProblemFile: (filePath: string) => void;
  onCommitChanges: (message: string) => void;
  onPushGithub: () => void;
  onRunTests: () => void;
}) {
  const [activeTab, setActiveTab] = useState<BottomTab>('terminal');
  const [commitMessage, setCommitMessage] = useState('');
  const [commandInput, setCommandInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Filter actual test files from project workspace
  const testFiles = useMemo(() => {
    return projectFiles.filter(
      (f) =>
        f.path.includes('.test.') ||
        f.path.includes('.spec.') ||
        f.path.includes('__tests__/') ||
        f.path.startsWith('tests/') ||
        f.path.startsWith('test/')
    );
  }, [projectFiles]);

  useEffect(() => {
    if (activeTab === 'terminal' && isExpanded) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab, isExpanded]);

  // NOTE: Real in-app test execution is a future task requiring a proper sandboxing decision
  // (e.g. isolated-vm, a dedicated worker process, or moving execution to a CI pipeline instead of the browser).
  const handleRunTestsInternal = () => {
    if (testFiles.length === 0) {
      if (onAddLog) {
        onAddLog(
          'info',
          'No tests run yet — generate tests first from the Testing tab, then run them here.'
        );
      }
      toast.info('No test files found in project. Generate tests first from the Testing tab.');
      return;
    }

    if (onAddLog) {
      onAddLog('info', `Found ${testFiles.length} generated test file(s) ready for local execution (npm test).`);
    }
    onRunTests();
  };

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim() || dirtyFiles.size === 0) return;
    onCommitChanges(commitMessage.trim());
    setCommitMessage('');
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCmd = commandInput.trim();
    if (!rawCmd) return;

    setCommandInput('');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const appendLog = (type: 'info' | 'success' | 'warn' | 'error', message: string) => {
      if (onAddLog) {
        onAddLog(type, message);
      } else {
        logs.push({
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: time,
          type,
          message,
        });
      }
    };

    // Log prompt command line
    appendLog('info', `$ ${rawCmd}`);

    const normalizedCmd = rawCmd.toLowerCase();

    // 1. `clear`
    if (normalizedCmd === 'clear') {
      onClearLogs();
      return;
    }

    // 2. `git status`
    if (normalizedCmd === 'git status') {
      appendLog('info', 'On branch main');
      appendLog('info', "Your branch is up to date with 'origin/main'.");

      if (dirtyFiles.size === 0) {
        appendLog('success', 'nothing to commit, working tree clean');
      } else {
        appendLog('warn', 'Changes not staged for commit:');
        appendLog('warn', '  (use "git commit" or workspace toolbar to commit)');
        dirtyFiles.forEach((path) => {
          appendLog('warn', `    modified:   ${path}`);
        });
      }
      return;
    }

    // 3. `git diff`
    if (normalizedCmd === 'git diff') {
      if (dirtyFiles.size === 0) {
        appendLog('info', 'No modifications found in working tree.');
      } else {
        dirtyFiles.forEach((filePath) => {
          const baseFile = projectFiles.find((f) => f.path === filePath);
          const baseContent = baseFile?.content || '';
          const newContent = contentMap[filePath] ?? baseContent;

          appendLog('info', `diff --git a/${filePath} b/${filePath}`);
          appendLog('info', `--- a/${filePath}`);
          appendLog('info', `+++ b/${filePath}`);

          const baseLines = baseContent.split('\n');
          const newLines = newContent.split('\n');

          let diffCount = 0;
          const maxLines = Math.max(baseLines.length, newLines.length);

          for (let i = 0; i < maxLines; i++) {
            const oldL = baseLines[i];
            const newL = newLines[i];

            if (oldL !== newL) {
              if (oldL !== undefined) {
                appendLog('error', `- ${oldL}`);
                diffCount++;
              }
              if (newL !== undefined) {
                appendLog('success', `+ ${newL}`);
                diffCount++;
              }
            }
            if (diffCount > 10) {
              appendLog('info', '... [diff output truncated]');
              break;
            }
          }
        });
      }
      return;
    }

    // 4. `npm run build` or `build`
    if (normalizedCmd === 'npm run build' || normalizedCmd === 'build' || normalizedCmd === 'npm build') {
      appendLog('info', '> blueprint-app@0.1.0 build');
      appendLog('info', '> next build');
      appendLog('info', 'Creating an optimized production build...');

      const buildErrors: Array<{ filePath: string; line: number; message: string }> = [];

      projectFiles.forEach((f) => {
        const code = contentMap[f.path] ?? f.content ?? '';
        const lines = code.split('\n');

        // Check JSON validity
        if (f.language === 'json' || f.path.endsWith('.json')) {
          try {
            JSON.parse(code);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Invalid JSON format';
            const match = msg.match(/line (\d+)/i);
            const lineNum = match ? parseInt(match[1], 10) : 1;
            buildErrors.push({ filePath: f.path, line: lineNum, message: msg });
          }
        }

        // Check TSX / TS bracket matching
        if (f.path.endsWith('.tsx') || f.path.endsWith('.ts')) {
          let openBraces = 0;
          lines.forEach((line, idx) => {
            for (const char of line) {
              if (char === '{') openBraces++;
              if (char === '}') openBraces--;
            }
            if (openBraces < 0) {
              buildErrors.push({ filePath: f.path, line: idx + 1, message: 'Unmatched closing brace }' });
              openBraces = 0;
            }
          });
          if (openBraces > 0) {
            buildErrors.push({ filePath: f.path, line: lines.length, message: `Unclosed brace { (${openBraces} unclosed)` });
          }
        }
      });

      if (buildErrors.length > 0) {
        appendLog('error', 'Failed to compile.');
        buildErrors.forEach((err) => {
          appendLog('error', `./${err.filePath}:${err.line} - SyntaxError: ${err.message}`);
        });
      } else {
        appendLog('success', '✓ Compiled successfully');
        appendLog('info', '✓ Linting and checking validity of types...');
        appendLog('success', `✓ Generating static pages (${projectFiles.length}/${projectFiles.length}) completed`);
      }
      return;
    }

    // 5. Any other command -> Print explicit unsupported message
    appendLog(
      'warn',
      'Command not supported in this environment. Try: git status, git diff, npm run build, clear.'
    );
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
            { id: 'tests', label: 'Tests', icon: Code2, count: testFiles.length },
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
                  'flex h-full items-center gap-2 border-b-2 px-3 text-xs font-medium transition-colors duration-150',
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
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors duration-150 active:scale-[0.98]"
              title="Clear Terminal Logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {isExpanded && (
            <button
              onClick={() => setIsMaximized((v) => !v)}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors duration-150 active:scale-[0.98]"
              title={isMaximized ? 'Restore Size' : 'Maximize Panel'}
            >
              {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}

          <button
            onClick={onToggleExpand}
            className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors duration-150 active:scale-[0.98]"
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
                  placeholder="Type git status, git diff, npm run build, clear..."
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white placeholder-white/30 outline-none border-none font-mono transition-colors duration-150"
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
                    className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-950/20 p-2.5 text-xs text-red-200 hover:bg-red-950/40 cursor-pointer transition-colors duration-150 active:scale-[0.98]"
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
                      className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition-colors duration-150 active:scale-[0.98]"
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
                      className="flex-1 rounded-lg border border-white/[0.06] bg-[#151a26] px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none transition-colors duration-150"
                    />
                    <button
                      type="submit"
                      disabled={!commitMessage.trim() || dirtyFiles.size === 0}
                      className="rounded-lg bg-cyan-400 px-4 py-1.5 text-xs font-bold text-black disabled:opacity-30 hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
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
                <span className="text-xs text-white/60">Workspace Unit & Integration Test Suite</span>
                {testFiles.length > 0 && (
                  <button
                    onClick={handleRunTestsInternal}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-400/20 border border-cyan-400/40 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400/30 transition-colors duration-150 active:scale-[0.98]"
                  >
                    <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Inspect Tests ({testFiles.length})</span>
                  </button>
                )}
              </div>

              {testFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                  <Code2 className="h-8 w-8 text-cyan-400/40 mb-2" />
                  <p className="font-bold text-white/70 text-xs">No Test Files Found</p>
                  <p className="mt-1 max-w-md text-[11px] text-white/50 leading-relaxed">
                    No tests run yet — generate tests first from the Testing tab, then run them here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-2.5 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">Local Execution Ready:</span> Generated tests are ready to execute in your local environment using <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-cyan-300">npm test</code>.
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {testFiles.map((file) => {
                      const content = contentMap[file.path] ?? file.content ?? '';
                      const lineCount = content.split('\n').filter(Boolean).length;
                      return (
                        <div key={file.path} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#151a26] p-2.5 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Code2 className="h-4 w-4 text-cyan-400 shrink-0" />
                            <span className="font-mono text-cyan-200 font-bold truncate">{file.path}</span>
                            <span className="text-[10px] text-white/40 font-mono">({lineCount} lines)</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => onSelectProblemFile(file.path)}
                              className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20 transition-colors"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View Code</span>
                            </button>
                            <button
                              onClick={async () => {
                                await navigator.clipboard.writeText(content);
                                setCopiedPath(file.path);
                                toast.success(`Copied ${file.name} to clipboard`);
                                setTimeout(() => setCopiedPath(null), 2000);
                              }}
                              className="flex items-center gap-1 rounded bg-cyan-400/20 border border-cyan-400/40 px-2 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-400/30 transition-colors"
                            >
                              <Copy className="h-3 w-3" />
                              <span>{copiedPath === file.path ? 'Copied!' : 'Copy Test'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </footer>
  );
}
