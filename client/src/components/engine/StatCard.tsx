'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { countRecords } from '@/lib/database.client';
import type { ComponentNodeType } from '@/config/schema';
import {
  FolderKanban,
  CheckSquare,
  Users,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  FolderKanban,
  CheckSquare,
  Users,
  AlertTriangle,
};

const colorMap: Record<string, { border: string; glow: string; text: string; bg: string }> = {
  cyan: {
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  green: {
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  amber: {
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  rose: {
    border: 'border-rose-500/30',
    glow: 'shadow-rose-500/20',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
};

interface StatCardProps {
  node: ComponentNodeType;
}

export function StatCard({ node }: StatCardProps) {
  const { t } = useTranslation();
  const props = node.props || {};
  const resource = props.resource as string;
  const label = (props.label as string) || t('common.no_data');
  const iconName = (props.icon as string) || 'FolderKanban';
  const color = (props.color as string) || 'cyan';
  const filter = props.filter as Record<string, unknown> | undefined;

  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const Icon = iconMap[iconName] || FolderKanban;
  const colors = colorMap[color] || colorMap.cyan;

  useEffect(() => {
    async function load() {
      try {
        const result = await countRecords(resource, filter);
        setCount(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load count');
        setCount(0);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resource, filter]);

  if (error && !loading) {
    return (
      <div className={`relative overflow-hidden rounded-xl border ${colors.border} bg-white/[0.03] p-5 backdrop-blur-md`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
            <p className={`mt-2 text-3xl font-bold tabular-nums text-zinc-600`}>--</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.bg}`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
        </div>
        <p className="mt-2 text-[10px] text-rose-400/60">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${colors.border} bg-white/[0.03] p-5 backdrop-blur-md transition-all duration-300 hover:shadow-lg ${colors.glow} hover:bg-white/[0.06]`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            {label}
          </p>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${colors.text}`}>
            {loading ? (
              <span className="inline-block h-9 w-16 animate-pulse rounded bg-white/5" />
            ) : (
              count?.toLocaleString() ?? '--'
            )}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.bg}`}>
          <Icon className={`h-6 w-6 ${colors.text}`} />
        </div>
      </div>
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${colors.bg} blur-2xl opacity-40`} />
    </div>
  );
}

