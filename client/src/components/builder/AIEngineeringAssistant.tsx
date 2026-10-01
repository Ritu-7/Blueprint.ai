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
  modifiedFiles?: Array<{ path: string; newContent: string }>;
  timestamp: string;
  isStreaming?: boolean;
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
  onApplyCode: (codeOrFiles: string | Array<{ path: string; newContent: string }>, targetPath?: string) => void;
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

  // Auto scroll to newest message during streaming / updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Streaming typewriter helper for AI responses
  const streamMessageContent = async (
    msgId: string,
    fullText: string,
    fullSnippet: string,
    modifiedFiles: Array<{ path: string; newContent: string }>
  ) => {
    // 1. Stream narrative text word by word
    const words = fullText.split(' ');
    let accumulatedText = '';

    for (let i = 0; i < words.length; i++) {
      accumulatedText += (i === 0 ? '' : ' ') + words[i];
      const snapshot = accumulatedText;
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, text: snapshot, isStreaming: true } : m))
      );
      await new Promise((r) => setTimeout(r, 18));
    }

    // 2. Stream code snippet line by line
    if (fullSnippet) {
      const lines = fullSnippet.split('\n');
      let accumulatedSnippet = '';
      const lineDelay = Math.max(8, Math.min(30, Math.floor(600 / lines.length)));

      for (let i = 0; i < lines.length; i++) {
        accumulatedSnippet += (i === 0 ? '' : '\n') + lines[i];
        const snippetSnapshot = accumulatedSnippet;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  codeSnippet: snippetSnapshot,
                  modifiedFiles,
                  isStreaming: true,
                }
              : m
          )
        );
        await new Promise((r) => setTimeout(r, lineDelay));
      }
    }

    // 3. Mark streaming completed
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              text: fullText,
              codeSnippet: fullSnippet,
              modifiedFiles,
              isStreaming: false,
            }
          : m
      )
    );
  };

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
      codeSnippet: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    if (!overridePrompt) setPrompt('');
    setIsThinking(true);

    try {
      const otherFilesSummary = projectFiles
        .filter((f) => f.path !== activeFile?.path)
        .map((f) => f.path)
        .join(', ');

      const res = await fetch('/api/chat-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentFile: {
            path: activeFile?.path || 'app/page.tsx',
            content: activeFileContent ?? activeFile?.content ?? '',
          },
          otherFilesSummary,
          instruction: textToSend,
        }),
      });

      const responseJson = await res.json();
      const rawData = responseJson?.data;
      const modifiedFiles: Array<{ path: string; newContent: string }> = Array.isArray(rawData?.modifiedFiles)
        ? rawData.modifiedFiles
        : Array.isArray(rawData)
        ? rawData
        : [];

      let primarySnippet = '';
      let targetPath = activeFile?.path || 'app/page.tsx';

      if (modifiedFiles.length > 0) {
        primarySnippet = modifiedFiles[0].newContent;
        targetPath = modifiedFiles[0].path;
      }

      const fileName = targetPath.split('/').pop() || targetPath;
      const responseNarrative = modifiedFiles.length > 0
        ? `Prepared targeted code edit for **${fileName}**.`
        : 'Processed your edit request.';

      // Trigger typewriter streaming display
      await streamMessageContent(aiMsgId, responseNarrative, primarySnippet, modifiedFiles);
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'AI generation error';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: `I encountered an issue processing your request: ${errorText}`,
                isStreaming: false,
              }
            : m
        )
      );
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
      handleSend(`Generate comprehensive unit tests for ${activeFile.path}`);
    }
  };

  const handleApply = (msg: AIMessage) => {
    if (msg.modifiedFiles && msg.modifiedFiles.length > 0) {
      onApplyCode(msg.modifiedFiles);
      setAppliedMessageId(msg.id);
      setTimeout(() => setAppliedMessageId(null), 2000);
    } else if (msg.codeSnippet && activeFile) {
      onApplyCode(msg.codeSnippet, activeFile.path);
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
              {msg.text ? (
                <div className="relative">
                  <MarkdownRenderer content={msg.text} />
                  {msg.isStreaming && !msg.codeSnippet && (
                    <span className="inline-block h-3 w-1.5 ml-0.5 bg-cyan-400 animate-pulse" />
                  )}
                </div>
              ) : msg.isStreaming ? (
                <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px]">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  <span>Thinking...</span>
                </div>
              ) : null}

              {/* Code Snippet Box with Apply Button */}
              {(msg.codeSnippet || (msg.modifiedFiles && msg.modifiedFiles.length > 0)) && (
                <div className="mt-3 rounded-lg border border-white/10 bg-[#070a10] p-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-2">
                    <span className="text-[10px] text-cyan-300 font-mono">
                      {msg.modifiedFiles && msg.modifiedFiles.length > 0
                        ? `Patch: ${msg.modifiedFiles[0].path}`
                        : 'Generated Code'}
                    </span>
                    {!msg.isStreaming && (
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
                            <span>
                              Apply to {msg.modifiedFiles?.[0]?.path.split('/').pop() || activeFile?.name || 'File'}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <pre className="max-h-48 overflow-x-auto font-mono text-[11px] text-cyan-100/90 leading-5 relative">
                    <code>{msg.codeSnippet || msg.modifiedFiles?.[0]?.newContent}</code>
                    {msg.isStreaming && (
                      <span className="inline-block h-3.5 w-1.5 ml-1 bg-cyan-400 animate-pulse" />
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && !messages.some((m) => m.isStreaming && m.text) && (
          <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-cyan-300 max-w-[90%]">
            <Sparkles className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
            <span>AI Engineer generating file patch...</span>
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
