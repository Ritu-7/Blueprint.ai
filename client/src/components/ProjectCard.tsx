import Link from 'next/link';
import { Calendar, Code, ArrowUpRight } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    created_at: string;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const formattedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <GlassCard className="group flex flex-col h-full border-white/5 hover:border-cyan-500/30">
      <div className="flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-500">
            <Code className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter group-hover:text-cyan-500 transition-colors">
          {project.name}
        </h3>
        <p className="text-white/50 text-sm line-clamp-2 mb-6">
          {project.description}
        </p>
      </div>

      <Link 
        href={`/project/${project.id}`}
        className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-background hover:border-cyan-500 transition-all group/btn"
      >
        Open Project
        <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
      </Link>
    </GlassCard>
  );
}

