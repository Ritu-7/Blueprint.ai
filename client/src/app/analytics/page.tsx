'use client';

import { useEffect, useState, useMemo } from 'react';
import { BarChart3, Gauge, TrendingUp, FolderKanban, FileCode2, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser, useSession } from '@clerk/nextjs';
import { WorkspacePage } from '@/components/app/WorkspacePage';
import { fetchUserProjects } from '@/lib/database.client';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import type { DatabaseProject } from '@/types/database';

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [projects, setProjects] = useState<DatabaseProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (user?.id) {
        try {
          const supabase = createClerkSupabaseClient(session);
          const data = await fetchUserProjects(user.id, supabase);
          if (data) setProjects(data as DatabaseProject[]);
        } catch (err) {
          console.error('[analytics] Failed to load workspace projects:', err);
        }
      }
      setLoading(false);
    }

    if (isLoaded) {
      loadData();
    }
  }, [user, isLoaded, session]);

  const totalFiles = useMemo(
    () => projects.reduce((acc, p) => acc + (p.files?.length || 0), 0),
    [projects]
  );

  const readySpecs = useMemo(
    () => projects.filter((p) => p.schema_code || p.api_code).length,
    [projects]
  );

  const avgFilesPerProject = useMemo(() => {
    if (projects.length === 0) return 0;
    return (totalFiles / projects.length).toFixed(1);
  }, [projects, totalFiles]);

  const statTiles = [
    { label: 'Active Blueprints', value: String(projects.length), detail: 'Total user projects saved', icon: FolderKanban },
    { label: 'Generated Files', value: String(totalFiles), detail: `Avg ${avgFilesPerProject} files / project`, icon: FileCode2 },
    { label: 'Architecture Specs', value: String(readySpecs), detail: 'Schemas & API contracts', icon: Layers },
  ];

  return (
    <WorkspacePage
      eyebrow="Workspace intelligence"
      title="Analytics"
      description="Real operational insights across your active blueprints, file generation count, and architectural specs."
      icon={BarChart3}
      actions={[{ label: 'Generate a project', href: '/builder' }]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {statTiles.map((tile, index) => (
          <motion.section
            key={tile.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.06 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{tile.label}</p>
              <tile.icon className="h-4 w-4 text-cyan-400/70" />
            </div>
            <p className="mt-5 text-4xl font-black text-white tabular-nums">
              {loading ? '…' : tile.value}
            </p>
            <p className="mt-2 text-sm text-cyan-200/70">{tile.detail}</p>
          </motion.section>
        ))}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.22 }}
        className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-cyan-300" />
            <h2 className="text-xl font-black text-white">Project Activity Distribution</h2>
          </div>
          <span className="text-xs font-mono text-cyan-300/80">REALTIME WORKSPACE DATA</span>
        </div>

        {projects.length === 0 ? (
          <div className="py-16 text-center text-xs text-white/40">
            No projects generated yet. Launch the Builder to prompt your first application blueprint.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((proj, i) => {
              const fileCount = proj.files?.length || 0;
              return (
                <motion.div
                  key={proj.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 + i * 0.04 }}
                  className="rounded-xl border border-white/10 bg-white/[0.035] p-4 hover:border-cyan-400/30 transition-all"
                >
                  <h3 className="font-bold text-sm text-white truncate">{proj.name}</h3>
                  <p className="mt-1 text-xs text-white/40 font-mono">{fileCount} source files</p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(15, fileCount * 10))}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-white/35">
          <span>Active Workspace Storage</span>
          <span className="inline-flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-cyan-400" /> Live database connection
          </span>
        </div>
      </motion.section>
    </WorkspacePage>
  );
}
