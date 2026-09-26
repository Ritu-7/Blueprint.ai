'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { GlassCard } from '@/components/GlassCard';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminProject {
  id: string;
  name: string;
  user_id: string;
  kind: string;
  created_at: string;
  updated_at: string;
}

// ─── Kind badge ───────────────────────────────────────────────────────────────

const KIND_COLORS: Record<string, string> = {
  todo: 'border-violet-400/30 bg-violet-400/10 text-violet-400',
  ecommerce: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400',
  dashboard: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-400',
  portfolio: 'border-amber-400/30 bg-amber-400/10 text-amber-400',
  chat: 'border-rose-400/30 bg-rose-400/10 text-rose-400',
  crm: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-400',
};

function KindBadge({ kind }: { kind: string }) {
  const cls = KIND_COLORS[kind] ?? 'border-white/10 bg-white/[0.04] text-white/40';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${cls}`}
    >
      {kind}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProjects() {
      try {
        const res = await fetch('/api/admin/projects');
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setProjects(json.data.projects as AdminProject[]);
          setTotal(json.data.total as number);
        } else {
          setError(json.error ?? 'Failed to load projects');
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProjects();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex items-center justify-between border-b border-white/10 pb-6"
      >
        <div>
          <h1 className="text-2xl font-black text-white">Projects</h1>
          <p className="mt-1 text-xs text-white/40">
            All projects across every user (service-role view).
          </p>
        </div>
        {!loading && !error && (
          <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/60">
            {total.toLocaleString()} total
          </span>
        )}
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">
              Loading projects…
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <GlassCard className="border-rose-400/20 bg-rose-400/5 p-6" hover={false}>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="text-sm font-black text-white">Failed to load projects</p>
              <p className="mt-0.5 text-xs text-white/50">{error}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Table */}
      {!loading && !error && (
        <GlassCard className="overflow-hidden p-0 border-white/10" hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-white/30">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-white/30">
                    Kind
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-white/30">
                    Owner ID
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-white/30">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-white/30">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-white/30">
                      No projects found.
                    </td>
                  </tr>
                )}
                {projects.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="transition-colors hover:bg-white/[0.025]"
                  >
                    <td className="px-4 py-3 font-semibold text-white">
                      {p.name}
                    </td>
                    <td className="px-4 py-3">
                      <KindBadge kind={p.kind} />
                    </td>
                    <td className="px-4 py-3 font-mono text-white/40">
                      {p.user_id ? (
                        <span title={p.user_id}>{p.user_id.slice(0, 16)}…</span>
                      ) : (
                        <span className="italic text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/40">
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-white/40">
                      {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
