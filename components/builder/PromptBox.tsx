'use client';

import { useState } from 'react';
import { History, Loader2, RefreshCw, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const examples = [
  'Create a todo app for a remote product team',
  'Build an ecommerce storefront for desk accessories',
  'Generate a CRM dashboard for a design agency',
  'Create a portfolio site for a creative developer',
];

export function PromptBox({
  onGenerate,
  isLoading,
  history,
}: {
  onGenerate: (prompt: string) => Promise<void> | void;
  isLoading: boolean;
  history: { prompt: string; date: string }[];
}) {
  const [prompt, setPrompt] = useState('');

  const submit = async (nextPrompt = prompt) => {
    const value = nextPrompt.trim();
    if (!value || isLoading) return;
    await onGenerate(value);
    setPrompt('');
  };

  return (
    <div className="flex h-full flex-col gap-5 p-4">
      <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
          <Sparkles className="h-4 w-4" />
          AI Architect
        </div>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe the website or app you want to build..."
          className="min-h-36 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50"
        />
        <button
          onClick={() => submit()}
          disabled={!prompt.trim() || isLoading}
          className={cn(
            'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.18em] transition',
            prompt.trim() && !isLoading
              ? 'bg-cyan-400 text-[#05070a] hover:scale-[1.01] hover:shadow-[0_0_28px_rgba(0,243,255,0.35)]'
              : 'bg-white/5 text-white/25'
          )}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isLoading ? 'Generating' : 'Generate App'}
        </button>
      </div>

      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-white/35">Example Prompts</p>
        <div className="space-y-2">
          {examples.map((example) => (
            <button
              key={example}
              onClick={() => setPrompt(example)}
              className="w-full rounded-xl border border-white/5 bg-white/[0.025] p-3 text-left text-xs leading-5 text-white/55 transition hover:border-cyan-400/25 hover:text-white"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <div className="mb-3 flex items-center justify-between">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-white/35">
            <History className="h-3.5 w-3.5" />
            History
          </p>
          {history[0] && (
            <button
              onClick={() => submit(history[0].prompt)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-cyan-300"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          )}
        </div>
        <div className="max-h-64 space-y-2 overflow-auto pr-1">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/30">No prompts yet</div>
          ) : (
            history.map((item) => (
              <button
                key={`${item.prompt}-${item.date}`}
                onClick={() => submit(item.prompt)}
                className="w-full rounded-xl border border-white/5 bg-white/[0.025] p-3 text-left transition hover:border-cyan-400/25"
              >
                <p className="truncate text-sm text-white/70">{item.prompt}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-white/25">{item.date}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
