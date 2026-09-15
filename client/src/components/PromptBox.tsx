'use client';

import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/utils/utils';

interface PromptBoxProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

export function PromptBox({ onGenerate, isLoading }: PromptBoxProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt);
      setPrompt('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
      <div className="relative glass rounded-xl overflow-hidden">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the app you want to build... (e.g., 'A modern CRM for freelance designers')"
          className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/40 p-4 min-h-[120px] resize-none text-sm lg:text-base"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="flex items-center justify-between p-3 border-t border-white/5 bg-white/[0.02]">
          <div className="flex gap-2">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">AI Generation Powered</span>
          </div>
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all",
              prompt.trim() && !isLoading
                ? "bg-cyan-500 text-background shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:scale-105"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-background/30 border-t-background animate-spin rounded-full" />
            ) : (
              <>
                <span>Generate</span>
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

