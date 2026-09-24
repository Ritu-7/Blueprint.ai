import React from 'react';
import { LucideIcon, FileX2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = FileX2,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <GlassCard className="p-8 text-center border-dashed border-white/10 bg-white/[0.01] space-y-3">
      <Icon className="h-10 w-10 text-white/20 mx-auto mb-2" />
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-black hover:bg-cyan-300 transition mt-2"
        >
          {actionLabel}
        </button>
      )}
    </GlassCard>
  );
}
