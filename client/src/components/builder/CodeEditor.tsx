'use client';

import { Check, Copy, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ProjectFile } from '@/lib/templates';

function languageLabel(file?: ProjectFile) {
  if (!file) return 'text';
  if (file.language === 'tsx') return 'TSX';
  if (file.language === 'ts') return 'TypeScript';
  if (file.language === 'sql') return 'SQL';
  if (file.language === 'md') return 'Markdown';
  return 'JSON';
}

export function CodeEditor({
  file,
  fallbackContent,
  title,
}: {
  file?: ProjectFile;
  fallbackContent?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const content = file?.content || fallbackContent || '';
  const lines = useMemo(() => content.split('\n'), [content]);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const download = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file?.name || 'blueprint-code.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#070a0f]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.025] px-4 py-2">
        <div>
          <p className="text-sm font-bold text-white/80">{file?.path || title || 'Generated output'}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">{languageLabel(file)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copy} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/45 hover:text-cyan-200">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          <button onClick={download} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/45 hover:text-cyan-200">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      {content ? (
        <pre className="min-h-0 flex-1 overflow-auto p-0 text-sm leading-6">
          <code>
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-[56px_1fr] hover:bg-white/[0.025]">
                <span className="select-none border-r border-white/5 pr-4 text-right font-mono text-white/20">{index + 1}</span>
                <span className="whitespace-pre px-4 font-mono text-cyan-100/80">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      ) : (
        <div className="grid flex-1 place-items-center text-sm text-white/30">No file selected</div>
      )}
    </div>
  );
}

