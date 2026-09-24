'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed break-words text-white/90">
      <ReactMarkdown
        components={{
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-cyan-200">{children}</em>,
          code: ({ className, children, ...props }) => {
            const isInline = !className && !String(children).includes('\n');
            if (isInline) {
              return (
                <code className="rounded bg-cyan-950/50 border border-cyan-500/20 px-1.5 py-0.5 font-mono text-[11px] text-cyan-200" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="my-2 rounded-lg border border-white/10 bg-[#070a10] p-3 font-mono text-[11px] text-cyan-100 overflow-x-auto">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-white/80">{children}</li>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
