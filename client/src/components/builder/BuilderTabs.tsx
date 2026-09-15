'use client';

import { Code2, Database, Eye, Server, FileText } from 'lucide-react';
import { cn } from '@/utils/utils';

export type BuilderTab = 'preview' | 'code' | 'schema' | 'api' | 'readme';

const tabs = [
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'readme', label: 'README', icon: FileText },
  { id: 'schema', label: 'Schema', icon: Database },
  { id: 'api', label: 'API', icon: Server },
] as const;

export function BuilderTabs({
  activeTab,
  onChange,
}: {
  activeTab: BuilderTab;
  onChange: (tab: BuilderTab) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/[0.025] px-3 py-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition',
            activeTab === tab.id
              ? 'bg-cyan-400 text-[#05070a] shadow-[0_0_18px_rgba(0,243,255,0.22)]'
              : 'text-white/45 hover:bg-white/5 hover:text-white'
          )}
        >
          <tab.icon className="h-3.5 w-3.5" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

