'use client';

import Link from 'next/link';
import { Loader2, AlertCircle, Terminal, ArrowUpRight } from 'lucide-react';

export function WorkspaceLoadingState({ message = 'Loading workspace data...' }: { message?: string }) {
  return (
    <div className="flex h-96 w-full items-center justify-center p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300/80">{message}</p>
      </div>
    </div>
  );
}

export function WorkspaceErrorState({
  title = 'Failed to load section',
  message = 'An error occurred while fetching data for this project section.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex h-96 w-full items-center justify-center p-8 text-center">
      <div className="max-w-md rounded-3xl border border-rose-400/20 bg-rose-400/10 p-8 shadow-2xl">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-400 mb-4" />
        <h2 className="text-lg font-black uppercase tracking-tight text-white">{title}</h2>
        <p className="mt-2 text-xs leading-5 text-white/60">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-black text-white hover:bg-rose-400 transition-colors duration-150 active:scale-[0.98]"
          >
            Retry Loading
          </button>
        )}
      </div>
    </div>
  );
}

export function WorkspaceEmptyState({
  icon: Icon = Terminal,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon?: typeof Terminal;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex h-96 w-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-black text-white">{title}</h2>
        <p className="mt-2 text-xs leading-6 text-white/50">{description}</p>
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all duration-150 active:scale-[0.98] shadow-[0_0_15px_rgba(0,243,255,0.3)]"
          >
            {actionLabel} <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
