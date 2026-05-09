'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Terminal, Copy, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ApiDocsPage() {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await fetch('/api/docs');
        const data = await res.json();
        setEndpoints(data.endpoints);
      } catch (err) {
        console.error('Failed to fetch API docs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(text);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="container mx-auto py-12 px-6 max-w-5xl">
      <header className="mb-16">
        <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mb-6">
          <Terminal className="h-6 w-6 text-cyan-500" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">API Reference</h1>
        <p className="text-lg text-white/50 leading-relaxed max-w-2xl">
          Programmatic access to the NexusCore engine. Automate your generation sequences with our robust REST endpoints.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-12">
          {endpoints.map((endpoint, idx) => (
            <section key={idx} className="space-y-6">
              <div className="flex items-center gap-4">
                <span className={cn(
                  "px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                  endpoint.method === 'POST' ? "bg-cyan-500 text-background" : "bg-blue-500 text-white"
                )}>
                  {endpoint.method}
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">{endpoint.name}</h2>
              </div>
              
              <GlassCard className="space-y-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-sm">
                  <code className="text-cyan-500">{endpoint.path}</code>
                  <button 
                    onClick={() => copyToClipboard(endpoint.path)}
                    className="text-white/20 hover:text-white transition-colors"
                  >
                    {copiedPath === endpoint.path ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <p className="text-sm text-white/60">{endpoint.description}</p>

                {endpoint.payload && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Request Body</h4>
                    <pre className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-white/80 overflow-x-auto">
                      <code>{JSON.stringify(endpoint.payload, null, 2)}</code>
                    </pre>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Success Response</h4>
                  <pre className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-white/80 overflow-x-auto">
                    <code>{JSON.stringify(endpoint.response, null, 2)}</code>
                  </pre>
                </div>
              </GlassCard>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
