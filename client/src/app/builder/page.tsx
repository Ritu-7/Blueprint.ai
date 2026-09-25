'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { toast } from 'sonner';
import { Sparkles, ArrowLeft, Layers, Loader2 } from 'lucide-react';
import { PromptBox } from '@/components/builder/PromptBox';
import { GenerationLoader } from '@/components/builder/GenerationLoader';
import { saveProject } from '@/lib/database';

function BuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('prompt') || '';

  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<{ prompt: string; date: string }[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('blueprint_prompt_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // Ignore local storage read errors
    }
  }, []);

  const handleGenerate = async (promptText: string) => {
    if (!promptText.trim()) return;

    setIsLoading(true);
    try {
      // Update local history
      const historyItem = {
        prompt: promptText,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      };
      const updatedHistory = [historyItem, ...history.filter((h) => h.prompt !== promptText)].slice(0, 10);
      setHistory(updatedHistory);
      try {
        localStorage.setItem('blueprint_prompt_history', JSON.stringify(updatedHistory));
      } catch {
        // Ignore local storage write errors
      }

      // 1. Call AI generation API
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      const responseData = await res.json();
      if (!res.ok || !responseData.success) {
        throw new Error(responseData.error || responseData.message || 'Failed to generate application blueprint');
      }

      const generated = responseData.data;

      // 2. Persist to Supabase database
      const newProject = await saveProject({
        user_id: user?.id || 'anonymous',
        name: generated.name || 'AI Application Blueprint',
        description: generated.description || `Generated from prompt: "${promptText.slice(0, 80)}"`,
        prompt: promptText,
        kind: generated.kind || 'saas',
        ui_code: generated.uiCode || generated.ui_code || '',
        schema_code: generated.schema || generated.schema_code || '',
        api_code: generated.api || generated.api_code || '',
        readme_code: generated.readme_code || '',
        files: generated.files || [],
        status: 'active',
      });

      if (newProject?.id) {
        toast.success(`Blueprint created for "${newProject.name}"!`);
        router.push(`/projects/${newProject.id}/builder`);
      } else {
        throw new Error('Project was created but did not return a valid ID.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      console.error('[builder/generate] Error:', err);
      toast.error(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#05070a] text-white flex flex-col justify-between overflow-x-hidden">
      {/* Background ambient gradient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_50%_0%,rgba(0,243,255,0.14),transparent_60%)]" />

      {/* Header bar */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#0a0d14]/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/70 hover:border-cyan-400/40 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400 text-[#05070a] font-black text-xs">
              B
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              BLUEPRINT<span className="text-cyan-400">.AI</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/40">
          <Layers className="h-3.5 w-3.5 text-cyan-400" />
          <span>New Project Blueprint Generator</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-300 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Prompt to Full-Stack IDE
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            What do you want to build today?
          </h1>
          <p className="mt-2 text-sm text-white/50 max-w-xl mx-auto">
            Describe your application. AI Architect will generate responsive UI components, PostgreSQL schema, REST API specs, and a complete code repository.
          </p>
        </div>

        {/* Prompt Box Card Container */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden">
          <PromptBox
            onGenerate={handleGenerate}
            isLoading={isLoading}
            history={history}
            initialPrompt={initialQuery}
          />
        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 border-t border-white/[0.06] py-4 text-center text-xs text-white/30">
        Generated blueprints include PostgreSQL DDL schemas, REST API documentation, and live preview runtime.
      </footer>

      {/* Full-screen Loading Overlay during generation */}
      {isLoading && <GenerationLoader />}
    </div>
  );
}

export default function StandaloneBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      }
    >
      <BuilderPageContent />
    </Suspense>
  );
}
