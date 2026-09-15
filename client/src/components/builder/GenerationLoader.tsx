'use client';

import { WandSparkles } from 'lucide-react';

const steps = ['Reading prompt', 'Selecting architecture', 'Generating files', 'Composing preview'];

export function GenerationLoader() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#05070a]/80 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl border border-cyan-400/20 bg-white/[0.05] p-6 shadow-[0_0_60px_rgba(0,243,255,0.12)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-[#05070a]">
            <WandSparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white">Generating</p>
            <p className="text-xs text-white/45">AI IDE is assembling your app</p>
          </div>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 text-sm text-white/65">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" style={{ animationDelay: `${index * 150}ms` }} />
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

