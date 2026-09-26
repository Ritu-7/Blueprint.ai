'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { motion } from 'framer-motion';
import {
  Users,
  FolderKanban,
  GitBranch,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalBlueprintVersions: number;
  queueDepth: number;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <GlassCard className="p-5 border-white/10" hover={false}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{label}</p>
          <p className="mt-2 text-3xl font-black text-white tabular-nums">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setStats(json.data as Stats);
        } else {
          setError(json.error ?? 'Failed to load stats');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Network error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="border-b border-white/10 pb-6"
      >
        <h1 className="text-2xl font-black text-white">Overview</h1>
        <p className="mt-1 text-xs text-white/40">
          Live platform metrics across all users and projects.
        </p>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">
              Fetching stats…
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
              <p className="text-sm font-black text-white">Failed to load stats</p>
              <p className="mt-0.5 text-xs text-white/50">{error}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Stat cards */}
      {!loading && stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, accent: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-400' },
            { label: 'Total Projects', value: stats.totalProjects.toLocaleString(), icon: FolderKanban, accent: 'border-violet-400/20 bg-violet-400/10 text-violet-400' },
            { label: 'Blueprint Versions', value: stats.totalBlueprintVersions.toLocaleString(), icon: GitBranch, accent: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400' },
            { label: 'Queue Depth', value: stats.queueDepth, icon: Layers, accent: stats.queueDepth > 10 ? 'border-rose-400/20 bg-rose-400/10 text-rose-400' : 'border-amber-400/20 bg-amber-400/10 text-amber-400' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
            >
              <StatTile
                label={item.label}
                value={item.value}
                icon={item.icon}
                accent={item.accent}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
