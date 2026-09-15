'use client';

import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { useState } from 'react';
import type { TemplateKind } from '@/lib/templates';
import { cn } from '@/utils/utils';
import { TemplateRenderer } from './TemplateRenderer';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const widths: Record<Viewport, string> = {
  desktop: 'w-full',
  tablet: 'max-w-[820px]',
  mobile: 'max-w-[390px]',
};

export function BrowserPreview({
  kind,
  title,
}: {
  kind?: TemplateKind;
  title?: string;
}) {
  const [viewport, setViewport] = useState<Viewport>('desktop');

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#05070a] p-4">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-300/80" />
          <span className="h-3 w-3 rounded-full bg-green-400/80" />
        </div>
        <div className="hidden min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-center text-xs text-white/35 md:block">
          https://preview.blueprint.ai/{kind || 'workspace'}
        </div>
        <div className="flex items-center gap-1">
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

      <div className="min-h-0 flex-1 overflow-auto">
        {kind && title ? (
          <div className={cn('mx-auto h-full overflow-hidden rounded-2xl border border-white/10 bg-[#05070a] shadow-2xl transition-all', widths[viewport])}>
            <TemplateRenderer kind={kind} title={title} />
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

