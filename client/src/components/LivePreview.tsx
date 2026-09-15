'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Code, Database, Eye, Sparkles, Terminal } from 'lucide-react';
import { cn } from '@/utils/utils';

interface LivePreviewProps {
  preview?: string;
  code: string;
  schema?: string;
  api?: string;
  isLoading?: boolean;
  error?: string | null;
}

const tabs = [
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'code', label: 'UI Code', icon: Code },
  { id: 'schema', label: 'Schema', icon: Database },
  { id: 'api', label: 'API', icon: Terminal },
] as const;

export function LivePreview({ preview = '', code, schema = '', api = '', isLoading, error }: LivePreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'schema' | 'api'>('preview');
  const hasOutput = Boolean(preview || code || schema || api);

  useEffect(() => {
    if (hasOutput) {
      setActiveTab('preview');
    }
  }, [hasOutput, preview, code, schema, api]);

  const getTabContent = () => {
    if (activeTab === 'code') return code;
    if (activeTab === 'schema') return schema;
    if (activeTab === 'api') return api;
    return preview;
  };

  const activeContent = getTabContent();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-white/5 bg-white/[0.02]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === tab.id ? "bg-cyan-500 text-background shadow-[0_0_10px_rgba(0,243,255,0.3)]" : "text-white/40 hover:text-white"
            )}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto bg-black/40 relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 border-4 border-cyan-500/30 border-t-cyan-500 animate-spin rounded-full" />
              <p className="text-cyan-500 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Generating...</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="h-14 w-14 mb-4 text-rose-400" />
            <h3 className="text-xl font-bold uppercase tracking-widest text-white">Generation Error</h3>
            <p className="max-w-md text-sm mt-3 text-white/60">{error}</p>
          </div>
        )}

        {!hasOutput && !isLoading && !error && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
            <Sparkles className="h-16 w-16 mb-4 text-cyan-500" />
            <h3 className="text-xl font-bold uppercase tracking-widest text-white">System Idle</h3>
            <p className="max-w-xs text-sm mt-2 text-white/60">Generate an app to see the preview and code here.</p>
          </div>
        )}

        {hasOutput && !error && (
          <div className="h-full">
            {activeTab === 'preview' && (
              <div className="h-full min-h-[560px] bg-[#05070a]">
                {preview ? (
                  <div
                    className="h-full"
                    dangerouslySetInnerHTML={{ __html: preview }}
                  />
                ) : (
                  <EmptyTab label="Preview is empty" />
                )}
              </div>
            )}
            
            {(activeTab === 'code' || activeTab === 'schema' || activeTab === 'api') && (
              activeContent ? (
                <pre className="min-h-full overflow-auto p-6 text-sm font-mono text-cyan-500/80 leading-relaxed">
                  <code>{activeContent}</code>
                </pre>
              ) : (
                <EmptyTab label={`${tabs.find((tab) => tab.id === activeTab)?.label} is empty`} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[360px] items-center justify-center p-8 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/30">{label}</p>
    </div>
  );
}

