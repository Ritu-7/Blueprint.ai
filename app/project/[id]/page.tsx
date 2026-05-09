import { createClient } from '@/lib/supabase-server';
import { LivePreview } from '@/components/LivePreview';
import { notFound } from 'next/navigation';
import { ArrowLeft, Share2, Download } from 'lucide-react';
import Link from 'next/link';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.01]">
        <div className="flex items-center gap-6">
          <Link 
            href="/dashboard" 
            className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-white">{project.name}</h1>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">Project ID: {project.id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-background font-black text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all">
            <Download className="h-4 w-4" />
            Export Code
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <LivePreview 
          code={project.ui_code} 
          schema={project.schema_code} 
          api={project.api_code} 
        />
      </div>
    </div>
  );
}
