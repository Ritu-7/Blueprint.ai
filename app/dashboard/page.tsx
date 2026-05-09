import Link from 'next/link';
import { Activity, ArrowUpRight, Boxes, Clock, LayoutDashboard, Plus, Rocket, Trash2 } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { GlassCard } from '@/components/GlassCard';
import { createClient } from '@/lib/supabase-server';
import { deleteProject } from '@/lib/database';
import { revalidatePath } from 'next/cache';

const fallbackProjects = [
  { id: 'demo-crm', name: 'Pipeline CRM', description: 'Sales workspace with stages, lead scoring, and generated API routes.', created_at: new Date().toISOString() },
  { id: 'demo-commerce', name: 'Commerce Grid', description: 'Premium product storefront with cart schema and inventory endpoints.', created_at: new Date().toISOString() },
  { id: 'demo-chat', name: 'Relay Chat', description: 'Messaging UI with conversations, message tables, and assistant replies.', created_at: new Date().toISOString() },
];

async function getProjects() {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[dashboard] failed to fetch projects', err);
    return [];
  }
}

export default async function DashboardPage() {
  const projects = await getProjects();

  async function handleDelete(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (id) {
      await deleteProject(id);
      revalidatePath('/dashboard');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
            <LayoutDashboard className="h-4 w-4" />
            Command Center
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">Project Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">Manage generated apps, recent prompts, deployment health, and builder activity from one workspace.</p>
        </div>
        <Link href="/builder" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#05070a]">
          <Plus className="h-4 w-4" />
          New Blueprint
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          { label: 'Projects', value: projects.length, Icon: Boxes },
          { label: 'Generations', value: 184, Icon: Activity },
          { label: 'Deployments', value: 12, Icon: Rocket },
          { label: 'Avg build', value: '4.8s', Icon: Clock },
        ].map(({ label, value, Icon }) => (
          <GlassCard key={label} className="rounded-2xl">
            <Icon className="h-5 w-5 text-cyan-300" />
            <strong className="mt-4 block text-3xl font-black text-white">{value}</strong>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-white/35">{label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white/40">Recent Projects</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {projects.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <p className="text-sm text-white/35">No projects found. Build your first blueprint!</p>
              </div>
            ) : (
              projects.map((project: any) => (
                <div key={project.id} className="group relative">
                  <Link href={`/project/${project.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.055]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-white">{project.name}</h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/45">{project.description}</p>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-white/25 transition group-hover:text-cyan-300" />
                    </div>
                    <div className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
                      <span className="h-2 w-2 rounded-full bg-cyan-300" />
                      Ready for preview
                    </div>
                  </Link>
                  <form action={handleDelete} className="absolute bottom-5 right-5 opacity-0 transition group-hover:opacity-100">
                    <input type="hidden" name="id" value={project.id} />
                    <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </section>

        <GlassCard className="rounded-2xl">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white/40">Activity Feed</h2>
          <div className="mt-5 space-y-4">
            {['Generated CRM schema', 'Opened mobile preview', 'Copied API route', 'Saved project files'].map((item) => (
              <div key={item} className="rounded-xl border border-white/5 bg-white/[0.025] p-3 text-sm text-white/55">{item}</div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
