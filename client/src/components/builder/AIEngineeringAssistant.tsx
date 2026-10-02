'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Sparkles, Send, Wand2, Bug, BookOpen,
  Check, History, RefreshCw, FileCode, Trash2, FilePlus, Undo2
} from 'lucide-react';
import type { ProjectFile } from '@/types/project';
import { cn } from '@/utils/utils';
import { MarkdownRenderer } from './MarkdownRenderer';

export type ContextScope = 'file' | 'project' | 'blueprint';

export interface FileChangeNotice {
  path: string;
  type: 'created' | 'modified' | 'deleted';
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  changedFiles?: FileChangeNotice[];
  timestamp: string;
  isStreaming?: boolean;
}

export function AIEngineeringAssistant({
  activeFile,
  activeFileContent,
  projectFiles,
  projectName,
  onApplyFileChanges,
  onUndo,
  canUndo,
}: {
  activeFile?: ProjectFile;
  activeFileContent?: string;
  projectFiles: ProjectFile[];
  projectName?: string;
  onApplyFileChanges: (changes: { updatedFiles: ProjectFile[]; notices: FileChangeNotice[] }) => void;
  onUndo?: () => void;
  canUndo?: boolean;
}) {
  const [contextScope, setContextScope] = useState<ContextScope>('project');
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: `Hello! I'm your AI Engineer for **${projectName || 'Blueprint Workspace'}**. Describe any feature, design change, or bug fix and I will generate and edit the code live.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Auto scroll to newest message during streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || prompt;
    if (!textToSend.trim() || isThinking) return;

    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const aiMsgId = `ai-${Date.now()}`;
    const initialAiMsg: AIMessage = {
      id: aiMsgId,
      role: 'assistant',
      text: '',
      changedFiles: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    if (!overridePrompt) setPrompt('');
    setIsThinking(true);

    try {
      // Construct history for endpoint
      const history = messages
        .filter((m) => m.id !== 'msg-welcome')
        .map((m) => ({ role: m.role, content: m.text }));

      const res = await fetch('/api/builder/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          history,
          currentFiles: projectFiles,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let currentFilesState = [...projectFiles];
      const noticesMap = new Map<string, FileChangeNotice>();

      let fullPlanText = '';
      let buildingFile: string | null = null;
      let fileBuffers: Record<string, string> = {};

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const event = JSON.parse(trimmed.slice(6));

            if (event.type === 'plan_delta' && event.chunk) {
              fullPlanText += event.chunk;
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMsgId ? { ...m, text: fullPlanText } : m))
              );
            } else if (event.type === 'file_start' && event.path) {
              buildingFile = event.path;
              fileBuffers[event.path] = '';
            } else if (event.type === 'file_delta' && event.path && event.chunk) {
              fileBuffers[event.path] = (fileBuffers[event.path] || '') + event.chunk;
            } else if (event.type === 'file_end' && event.path) {
              const path = event.path;
              const content = fileBuffers[path] || '';
              const exists = currentFilesState.some((f) => f.path === path);

              if (exists) {
                currentFilesState = currentFilesState.map((f) => (f.path === path ? { ...f, content } : f));
                noticesMap.set(path, { path, type: 'modified' });
              } else {
                currentFilesState.push({
                  path,
                  name: path.split('/').pop() || path,
                  language: path.endsWith('.tsx') ? 'tsx' : path.endsWith('.ts') ? 'ts' : 'json',
                  content,
                });
                noticesMap.set(path, { path, type: 'created' });
              }

              const noticesArr = Array.from(noticesMap.values());
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMsgId ? { ...m, changedFiles: noticesArr } : m))
              );
              onApplyFileChanges({ updatedFiles: currentFilesState, notices: noticesArr });
              buildingFile = null;
            } else if (event.type === 'file_delete' && event.path) {
              const path = event.path;
              currentFilesState = currentFilesState.filter((f) => f.path !== path);
              noticesMap.set(path, { path, type: 'deleted' });

              const noticesArr = Array.from(noticesMap.values());
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMsgId ? { ...m, changedFiles: noticesArr } : m))
              );
              onApplyFileChanges({ updatedFiles: currentFilesState, notices: noticesArr });
            } else if (event.type === 'error' && event.error) {
              throw new Error(event.error);
            }
          } catch {
            // Ignore malformed SSE JSON
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false } : m))
      );
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'AI generation error';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: `Issue processing request: ${errorText}`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-white/[0.06] bg-[#0f131c]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-3 bg-[#0f131c] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-400 text-black font-black">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-white">AI Assistant</span>
        </div>

        {canUndo && onUndo && (
          <button
            onClick={onUndo}
            title="Undo last AI edit"
            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-400/20 transition"
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </button>
        )}
      </div>

      {/* Quick Action Chips */}
      <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.06] p-2 bg-[#0c0f17] shrink-0 text-xs">
        <button
          onClick={() => activeFile && handleSend(`Fix any errors or bugs in ${activeFile.path}`)}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          <Bug className="h-3 w-3 text-rose-400" /> Fix File
        </button>
        <button
          onClick={() => activeFile && handleSend(`Optimize and refactor ${activeFile.path}`)}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          <Wand2 className="h-3 w-3 text-cyan-400" /> Refactor
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              'rounded-xl p-3.5 space-y-2 border shadow-lg transition-all',
              m.role === 'user'
                ? 'border-cyan-500/20 bg-cyan-950/20 text-cyan-100 ml-4'
                : 'border-white/10 bg-white/[0.03] text-white/90 mr-4'
            )}
          >
            <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
              <span>{m.role === 'user' ? 'You' : 'AI Assistant'}</span>
              <span>{m.timestamp}</span>
            </div>

            <MarkdownRenderer content={m.text || (m.isStreaming ? 'Thinking...' : '')} />

            {/* Changed Files List */}
            {m.changedFiles && m.changedFiles.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Files Changed ({m.changedFiles.length}):</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.changedFiles.map((ch) => (
                    <span
                      key={ch.path}
                      className={cn(
                        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-bold border',
                        ch.type === 'created' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' :
                        ch.type === 'modified' ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' :
                        'border-rose-400/30 bg-rose-400/10 text-rose-300'
                      )}
                    >
                      {ch.type === 'created' ? <FilePlus className="h-3 w-3" /> : ch.type === 'deleted' ? <Trash2 className="h-3 w-3" /> : <FileCode className="h-3 w-3" />}
                      {ch.path.split('/').pop() || ch.path}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-white/[0.06] bg-[#0c0f17] shrink-0"
      >
        <div className="relative">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI to add features, edit files, or fix bugs..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 pr-10 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none resize-none"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isThinking}
            className="absolute right-2.5 bottom-2.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400 text-black hover:bg-cyan-300 disabled:opacity-30 transition"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
}
