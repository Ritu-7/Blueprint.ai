'use client';

import { useState, useEffect, useRef } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import {
  Bot, Send, User, Sparkles, Database, FileCode2, Search,
  RefreshCw, Play, CheckCircle2, ShieldCheck, ExternalLink,
  ChevronRight, BookOpen, Layers, X, Code2, Copy, HelpCircle,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { GlassCard } from '@/components/GlassCard';
import { toast } from 'sonner';
import { cn } from '@/utils/utils';
import type { SourceReference } from '@/validators/rag';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: SourceReference[];
  timestamp: string;
}

export default function ProjectAssistantPage() {
  const { project } = useProject();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello! I am your RAG Codebase Assistant for **${project?.name || 'this workspace'}**.\n\nAsk me questions like:\n- *"Where is authentication implemented?"*\n- *"What API routes require JWT auth?"*\n- *"Show database schema definitions."*\n\nI answer strictly using retrieved code chunks from your indexed repository.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  // GitHub Indexing fields
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [isIndexed, setIsIndexed] = useState(false);
  const [indexedStats, setIndexedStats] = useState<{ files: number; chunks: number } | null>(null);

  // Active conversation ID
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  // Source Snippet Inspector Modal
  const [activeSnippet, setActiveSnippet] = useState<SourceReference | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const indexRepository = async () => {
    if (!owner.trim() || !repo.trim()) {
      toast.error('Owner and Repository name are required to index');
      return;
    }
    setIsIndexing(true);
    toast.info(`Indexing repository ${owner}/${repo}...`);
    try {
      const res = await fetch('/api/rag/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project?.id,
          owner: owner.trim(),
          repo: repo.trim(),
          branch: branch.trim() || 'main',
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error?.message || 'Indexing failed');
        return;
      }
      setIsIndexed(true);
      setIndexedStats({ files: data.data.filesProcessed, chunks: data.data.chunksStored });
      toast.success(`Successfully indexed ${data.data.filesProcessed} files into ${data.data.chunksStored} code chunks!`);
    } catch {
      toast.error('Failed to index repository');
    } finally {
      setIsIndexing(false);
    }
  };

  const handleSend = async (customMessage?: string) => {
    const queryText = (customMessage || input).trim();
    if (!queryText || isLoading) return;

    if (!customMessage) setInput('');

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project?.id,
          message: queryText,
          conversationId,
          owner: owner.trim() || undefined,
          repo: repo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error?.message || 'Query failed');
        return;
      }

      const { answer, sources, conversationId: newConvId } = data.data;
      if (newConvId) setConversationId(newConvId);

      const asstMsg: Message = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: answer,
        sources,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, asstMsg]);
    } catch {
      toast.error('Failed to communicate with RAG assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'Where is authentication implemented?',
    'What database models are defined in schema?',
    'Show all REST API endpoints and request parameters',
    'Where are environment variables validated?',
  ];

  return (
    <div className="flex h-screen flex-col bg-[#05070a] overflow-hidden">
      {/* Top Header */}
      <div className="border-b border-white/10 bg-[#090c12] px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
              <Bot className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">RAG Codebase Assistant</h1>
                <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <ShieldCheck className="h-3 w-3" /> Vector Search Verified
                </span>
              </div>
              <p className="text-xs text-white/40">{project?.name} · pgvector + Gemini Context RAG</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isIndexed && indexedStats && (
              <span className="text-xs font-bold text-cyan-300 border border-cyan-500/30 bg-cyan-950/20 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                {indexedStats.files} Files · {indexedStats.chunks} Chunks
              </span>
            )}
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome-reset',
                    sender: 'assistant',
                    text: `New conversation started for **${project?.name}**. Ask me any question about your codebase!`,
                    timestamp: new Date().toLocaleTimeString(),
                  },
                ]);
                setConversationId(undefined);
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition"
            >
              New Chat
            </button>
          </div>
        </div>

        {/* Indexing Bar */}
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-white/5 flex-wrap">
          <FaGithub className="h-4 w-4 text-white/40 shrink-0" />
          <input
            type="text"
            placeholder="GitHub Owner (e.g. Ritu-7)"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="w-40 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
          />
          <span className="text-white/30">/</span>
          <input
            type="text"
            placeholder="Repository (e.g. Blueprint.ai)"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="w-44 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
          />
          <input
            type="text"
            placeholder="main"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-24 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
          />
          <button
            onClick={indexRepository}
            disabled={isIndexing || !owner.trim() || !repo.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-black text-black hover:bg-cyan-300 disabled:opacity-40 transition"
          >
            {isIndexing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
            {isIndexing ? 'Indexing Vectors...' : 'Index Repository'}
          </button>
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex items-start gap-4 max-w-4xl', msg.sender === 'user' ? 'ml-auto flex-row-reverse' : '')}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl shrink-0 font-bold',
                msg.sender === 'user'
                  ? 'bg-cyan-400 text-black'
                  : 'bg-white/10 text-cyan-300 border border-white/10'
              )}
            >
              {msg.sender === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
            </div>

            <div className="space-y-3 flex-1 min-w-0">
              <div
                className={cn(
                  'rounded-2xl p-4 text-xs leading-relaxed space-y-2',
                  msg.sender === 'user'
                    ? 'bg-cyan-400/10 border border-cyan-400/30 text-white'
                    : 'bg-white/[0.03] border border-white/10 text-white/90'
                )}
              >
                <div className="whitespace-pre-wrap font-sans text-xs">{msg.text}</div>
                <span className="block text-[10px] text-white/30 text-right">{msg.timestamp}</span>
              </div>

              {/* Source References Pill Grid */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
                    <Search className="h-3 w-3" /> Retrieved Code Context ({msg.sources.length} Sources)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSnippet(src)}
                        className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-2.5 py-1 text-[11px] font-mono text-cyan-200 hover:bg-cyan-400/20 transition"
                      >
                        <FileCode2 className="h-3 w-3 text-cyan-400" />
                        <span>{src.filePath}</span>
                        <span className="text-white/40">#L{src.startLine}-L{src.endLine}</span>
                        <span className="rounded bg-cyan-400/20 px-1 text-[9px] text-cyan-300 font-bold">{Math.round(src.score * 100)}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 max-w-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-300 border border-white/10 shrink-0">
              <Bot className="h-5 w-5 animate-pulse" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/50 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
              Retrieving vector code context and querying LLM...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips Bar */}
      <div className="px-6 py-2 bg-[#090c12] border-t border-white/5 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] uppercase font-bold text-white/30 shrink-0">Suggested:</span>
        {suggestedQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70 hover:border-cyan-400/40 hover:text-white transition whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="border-t border-white/10 p-4 bg-[#090c12]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask AI about ${project?.name} code...`}
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-black hover:bg-cyan-300 disabled:opacity-40 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Snippet Inspector Modal */}
      {activeSnippet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#090c12] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-5 w-5 text-cyan-400" />
                <h3 className="font-mono text-sm font-bold text-white">{activeSnippet.filePath}</h3>
                <span className="text-xs text-white/40">Lines {activeSnippet.startLine}-{activeSnippet.endLine}</span>
              </div>
              <button
                onClick={() => setActiveSnippet(null)}
                className="rounded-lg p-1 text-white/40 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <pre className="max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-cyan-100/90 leading-relaxed">
              {activeSnippet.snippet}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeSnippet.snippet);
                  toast.success('Snippet copied to clipboard');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Snippet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
