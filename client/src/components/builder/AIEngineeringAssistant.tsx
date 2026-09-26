'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Sparkles, Send, Wand2, Bug, BookOpen, TestTube2,
  Check, ArrowRight
} from 'lucide-react';
import type { ProjectFile } from '@/types/project';
import { cn } from '@/utils/utils';
import { MarkdownRenderer } from './MarkdownRenderer';

export type ContextScope = 'file' | 'project' | 'blueprint';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  codeSnippet?: string;
  timestamp: string;
}

export function AIEngineeringAssistant({
  activeFile,
  activeFileContent,
  projectFiles,
  projectName,
  onApplyCode,
}: {
  activeFile?: ProjectFile;
  activeFileContent?: string;
  projectFiles: ProjectFile[];
  projectName?: string;
  onApplyCode: (code: string) => void;
}) {
  const [contextScope, setContextScope] = useState<ContextScope>('file');
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [appliedMessageId, setAppliedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: `Hello! I'm your AI Engineering Assistant for **${projectName || 'Blueprint Workspace'}**. Ask me to refactor code, generate tests, fix errors, or build new features.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Auto scroll to newest message
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

    setMessages((prev) => [...prev, userMsg]);
    if (!overridePrompt) setPrompt('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          contextScope,
          activeFilePath: activeFile?.path,
          activeContent: activeFileContent,
          fileCount: projectFiles.length,
        }),
      });

      const data = await res.json();
      const payload = data.data || data;

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: payload.uiCode
          ? `Generated update for **${activeFile?.name || 'component'}**.`
          : payload.description || 'Here is the engineered code based on your request.',
        codeSnippet: payload.uiCode || payload.code || (typeof payload === 'string' ? payload : undefined),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'AI generation error';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `I encountered an issue processing your request: ${errorText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleQuickAction = (type: 'fix' | 'explain' | 'refactor' | 'tests') => {
    if (!activeFile) return;
    if (type === 'fix') {
      handleSend(`Inspect and fix syntax or logical errors in ${activeFile.path}`);
    } else if (type === 'explain') {
      handleSend(`Explain the architecture and key responsibilities of ${activeFile.path}`);
    } else if (type === 'refactor') {
      handleSend(`Refactor and optimize performance for ${activeFile.path}`);
    } else if (type === 'tests') {
      handleSend(`Generate comprehensive Jest / Vitest unit tests for ${activeFile.path}`);
    }
  };

  const handleApply = (msg: AIMessage) => {
    if (msg.codeSnippet) {
      onApplyCode(msg.codeSnippet);
      setAppliedMessageId(msg.id);
      setTimeout(() => setAppliedMessageId(null), 2000);
    }
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-white/[0.06] bg-[#0f131c]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-3 bg-[#0f131c] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-400 text-black">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-white">AI Engineer</span>
        </div>

        {/* Segmented Context Scope Selector */}
        <div className="flex items-center rounded-lg border border-white/[0.06] bg-[#151a26] p-0.5 text-[11px]">
          {(['file', 'project', 'blueprint'] as ContextScope[]).map((scope) => (
            <button
              key={scope}
              onClick={() => setContextScope(scope)}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all duration-150 font-medium capitalize',
                contextScope === scope
                  ? 'bg-cyan-400/20 text-cyan-300 font-bold'
                  : 'text-white/40 hover:text-white'
              )}
            >
              {scope}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Action Chips Grid (2x2) */}
      {activeFile && (
        <div className="grid grid-cols-2 gap-1.5 p-3 border-b border-white/[0.06] bg-black/20 shrink-0">
          <button
            onClick={() => handleQuickAction('fix')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 px-2 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-900/30 transition-colors duration-150 active:scale-[0.98]"
          >
            <Bug className="h-3.5 w-3.5 text-red-400" />
            <span>Fix Errors</span>
          </button>
          <button
            onClick={() => handleQuickAction('refactor')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-2 py-1.5 text-[11px] font-medium text-cyan-200 hover:bg-cyan-900/30 transition-colors duration-150 active:scale-[0.98]"
          >
            <Wand2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Refactor</span>
          </button>
          <button
            onClick={() => handleQuickAction('explain')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/20 px-2 py-1.5 text-[11px] font-medium text-amber-200 hover:bg-amber-900/30 transition-colors duration-150 active:scale-[0.98]"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span>Explain</span>
          </button>
          <button
            onClick={() => handleQuickAction('tests')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-900/30 transition-colors duration-150 active:scale-[0.98]"
          >
            <TestTube2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Tests</span>
          </button>
        </div>
      )}

      {/* Messages Thread */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}
          >
            <div
              className={cn(
                'rounded-xl p-3 text-xs leading-relaxed max-w-[90%] border shadow-sm',
                msg.role === 'user'
                  ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-100'
                  : 'border-white/[0.06] bg-[#151a26] text-white/90'
              )}
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1 mb-2 text-[10px] text-white/40">
                <span className="font-bold">{msg.role === 'user' ? 'You' : 'AI Assistant'}</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Markdown Content Rendering */}
              <MarkdownRenderer content={msg.text} />

              {/* Code Snippet Box with Apply Button */}
              {msg.codeSnippet && (
                <div className="mt-3 rounded-lg border border-white/10 bg-[#070a10] p-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-2">
                    <span className="text-[10px] text-cyan-300 font-mono">Generated Code</span>
                    {activeFile && (
                      <button
                        onClick={() => handleApply(msg)}
                        className="flex items-center gap-1 rounded bg-cyan-400 px-2 py-0.5 text-[10px] font-bold text-black hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
                      >
                        {appliedMessageId === msg.id ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Applied</span>
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-3 w-3" />
                            <span>Apply to {activeFile.name}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <pre className="max-h-48 overflow-x-auto font-mono text-[11px] text-cyan-100/90 leading-5">
                    <code>{msg.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-cyan-300 max-w-[90%]">
            <Sparkles className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
            <span>AI Engineer analyzing context...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pinned Input Area */}
      <div className="border-t border-white/[0.06] p-3 bg-[#0f131c] shrink-0">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              activeFile
                ? `Ask AI to modify ${activeFile.name}...`
                : 'Ask AI code assistant...'
            }
            rows={2}
            className="w-full resize-none rounded-lg border border-white/[0.06] bg-[#151a26] p-3 pr-10 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-colors duration-150"
          />
          <button
            onClick={() => handleSend()}
            disabled={!prompt.trim() || isThinking}
            className="absolute right-2.5 bottom-2.5 flex h-7 w-7 items-center justify-center rounded-md bg-cyan-400 text-black disabled:opacity-30 hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
            title="Send Message (Enter)"
            aria-label="Send Message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
