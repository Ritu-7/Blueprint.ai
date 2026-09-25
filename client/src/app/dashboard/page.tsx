'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useSession } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import { Activity, ArrowUpRight, CheckCircle2, FolderKanban, Sparkles, Plus, Layers, Terminal } from 'lucide-react';
import { WorkspacePage } from '@/components/app/WorkspacePage';
import { ProjectCard } from '@/components/ProjectCard';
import { fetchUserProjects } from '@/lib/database.client';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import type { DatabaseProject } from '@/types/database';

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'Recently';
  }
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [projects, setProjects] = useState<DatabaseProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      if (user?.id) {
        try {
          const supabase = createClerkSupabaseClient(session);
          const data = await fetchUserProjects(user.id, supabase);
          if (data) setProjects(data as DatabaseProject[]);
        } catch (err) {
          console.error('[dashboard] Error loading projects:', err);
        }
      }
      setLoading(false);
    }

    if (isLoaded) {
      loadProjects();
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

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
      )
      .slice(0, 3);
  }, [projects]);

  const metrics = [
    {
      label: 'Active blueprints',
      value: String(projects.length).padStart(2, '0'),
      detail: user
        ? projects.length > 0
          ? `${projects.length} saved in cloud`
          : 'No blueprints created'
        : 'Demo workspace',
    },
    {
      label: 'Generated files',
      value: String(totalFiles).padStart(2, '0'),
      detail:
        projects.length > 0
          ? `Across ${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`
          : '0 files generated',
    },
    {
      label: 'Architecture specs',
      value: String(readySpecs).padStart(2, '0'),
      detail:
        projects.length > 0
          ? `${readySpecs} schemas & API contracts`
          : 'Ready on blueprint generation',
    },
  ];

  return (
    <WorkspacePage
      eyebrow="Command center"
      title="Dashboard"
      description="A focused view of your projects, generation activity, and the next useful action."
      icon={FolderKanban}
      actions={[{ label: 'Open Builder', href: '/builder' }]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <section key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{metric.label}</p>
            <p className="mt-5 text-4xl font-black text-white">{metric.value}</p>
            <p className="mt-2 text-sm text-cyan-200/70">{metric.detail}</p>
          </section>
        ))}
      </div>

      {/* User Projects Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              Your Blueprints
            </h2>
            <p className="text-xs text-white/40 mt-1">Generated full-stack apps and design prototypes</p>
          </div>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400/10 border border-cyan-400/30 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-300 hover:bg-cyan-400/20 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Blueprint
          </Link>
        </div>

        {projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((proj) => (
              <ProjectCard
                key={proj.id}
                project={{
                  id: proj.id,
                  name: proj.name,
                  description: 'AI-generated application blueprint',
                  created_at: proj.created_at,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <Terminal className="mx-auto h-8 w-8 text-cyan-400/60 mb-3" />
            <p className="text-sm font-bold text-white/70">No saved cloud projects yet</p>
            <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
              Launch the Builder to prompt your first full-stack application. Projects auto-save to your workspace.
            </p>
            <Link
              href="/builder"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all"
            >
              Start Building Now <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Recent activity</p>
              <h3 className="mt-2 text-2xl font-black text-white">Your workspace is moving</h3>
            </div>
            <Activity className="h-6 w-6 text-cyan-300" />
          </div>
          <div className="mt-8 space-y-4">
            {recentProjects.length > 0 ? (
              recentProjects.map((proj) => (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.id}/overview`}
                  className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-white/65 hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2 className="h-4 w-4 text-cyan-300 shrink-0" />
                    <span className="truncate font-medium text-white/80 group-hover:text-cyan-200 transition-colors">
                      {proj.name} updated
                    </span>
                  </div>
                  <span className="text-xs text-white/40 shrink-0">
                    {formatRelativeTime(proj.updated_at || proj.created_at)}
                  </span>
                </Link>
              ))
            ) : (
              <div className="border-t border-white/10 pt-4 text-sm text-white/40 flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-white/20 shrink-0" />
                <span>No activity yet — start your first blueprint</span>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-6">
          <Sparkles className="h-6 w-6 text-cyan-300" />
          <h3 className="mt-5 text-2xl font-black text-white">Start with a prompt</h3>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Turn an idea into a working project with files, API docs, schema, and a live preview.
          </p>
          <Link href="/builder" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-200 hover:text-white transition-colors">
            Launch Builder <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </WorkspacePage>
  );
}
