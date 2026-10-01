'use client';

import { Monitor, Smartphone, Tablet, ExternalLink, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { TemplateKind } from '@/lib/templates';
import type { ProjectFile } from '@/types/project';
import { cn } from '@/utils/utils';
import { SandpackLivePreview } from './SandpackLivePreview';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const widths: Record<Viewport, string> = {
  desktop: 'w-full',
  tablet: 'max-w-[820px]',
  mobile: 'max-w-[390px]',
};

function slugify(name?: string): string {
  if (!name) return 'workspace';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function BrowserPreview({
  title,
  projectId,
  files = [],
  activeFile,
  entryFile = 'app/page.tsx',
}: {
  kind?: TemplateKind;
  title?: string;
  projectId?: string;
  files?: ProjectFile[];
  activeFile?: ProjectFile;
  entryFile?: string;
}) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [copied, setCopied] = useState(false);

  const identifier = projectId || slugify(title);
  // Real preview URL — served by /api/preview/[slug] route
  const previewUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/preview/${identifier}`
      : `/api/preview/${identifier}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(previewUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [previewUrl]);

  const handleOpenInBrowser = useCallback(() => {
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  }, [previewUrl]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#05070a] p-4">
      {/* Browser chrome bar */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
        {/* Traffic lights */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="h-3 w-3 rounded-full bg-rose-400/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-300/80" />
          <span className="h-3 w-3 rounded-full bg-green-400/80" />
        </div>

        {/* URL bar — clickable, opens real preview */}
        <button
          onClick={handleOpenInBrowser}
          title="Open preview in new tab"
          className="hidden min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-center text-xs text-white/50 md:flex items-center justify-center gap-1.5 truncate hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-cyan-500/5 transition-colors cursor-pointer"
        >
          <span className="truncate">
            {typeof window !== 'undefined'
              ? `${window.location.host}/api/preview/${identifier}`
              : `/api/preview/${identifier}`}
          </span>
          <ExternalLink className="h-3 w-3 shrink-0 text-white/30" />
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Copy URL */}
          <button
            onClick={handleCopy}
            title="Copy preview URL"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white transition"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-cyan-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Open in browser */}
          <button
            onClick={handleOpenInBrowser}
            title="Open in browser"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>

          {/* Viewport toggles */}
          {[
            { id: 'desktop', Icon: Monitor },
            { id: 'tablet', Icon: Tablet },
            { id: 'mobile', Icon: Smartphone },
          ].map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => setViewport(id as Viewport)}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-lg transition',
                viewport === id ? 'bg-cyan-400 text-[#05070a]' : 'text-white/40 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Preview frame */}
      <div className="min-h-[350px] flex-1 overflow-hidden flex flex-col">
        {files && files.length > 0 ? (
          <div
            className={cn(
              'mx-auto h-full w-full flex-1 min-h-[350px] overflow-hidden rounded-2xl border border-white/10 bg-[#05070a] shadow-2xl transition-all flex flex-col',
              widths[viewport]
            )}
          >
            <SandpackLivePreview files={files} activeFile={activeFile} entryFile={entryFile} />
          </div>
        ) : (
          <div className="grid h-full place-items-center rounded-2xl border border-dashed border-white/10 text-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/35">Preview idle</p>
              <p className="mt-2 text-sm text-white/30">Generate a project to open the live browser preview.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
