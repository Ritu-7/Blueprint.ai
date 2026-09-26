'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileCode2,
  ListTodo,
  Network,
  Database,
  Terminal,
  CheckSquare,
  Hammer,
  GitBranch,
  Bot,
  ShieldAlert,
  TestTube,
  Activity,
  Layers,
  ChevronLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProject } from './ProjectContext';

interface ProjectSidebarProps {
  projectId: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const navSections = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Blueprint', href: '/blueprint', icon: FileCode2 },
  { name: 'Requirements', href: '/requirements', icon: ListTodo },
  { name: 'Architecture', href: '/architecture', icon: Network },
  { name: 'Database', href: '/database', icon: Database },
  { name: 'APIs', href: '/apis', icon: Terminal },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Builder IDE', href: '/builder', icon: Hammer, highlight: true },
  { name: 'GitHub', href: '/github', icon: GitBranch },
  { name: 'AI Assistant', href: '/assistant', icon: Bot },
  { name: 'Code Review', href: '/reviews', icon: ShieldAlert },
  { name: 'Testing', href: '/testing', icon: TestTube },
  { name: 'Health', href: '/health', icon: Activity },
];

export function ProjectSidebar({ projectId, isMobileOpen, onMobileClose }: ProjectSidebarProps) {
  const pathname = usePathname();
  const { project } = useProject();

  const sidebarContent = (
    <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-[#05070a] text-white">
      {/* Workspace Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-cyan-400 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Dashboard
        </Link>
        {onMobileClose && (
          <button onClick={onMobileClose} className="text-white/40 hover:text-white transition-colors duration-150 md:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Project Identity */}
      <div className="border-b border-white/10 p-4 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-bold text-xs">
            <Layers className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black text-white">{project?.name || 'Project Workspace'}</h2>
            <p className="truncate text-[10px] font-mono text-cyan-400/60 uppercase">{project?.kind || 'Blueprint'}</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navSections.map((item) => {
          const fullPath = `/projects/${projectId}${item.href}`;
          const isActive = pathname === fullPath || (item.href === '/overview' && pathname === `/projects/${projectId}`);

          return (
            <Link
              key={item.href}
              href={fullPath}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200',
                isActive
                  ? 'bg-cyan-400 text-[#05070a] font-black shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                  : item.highlight
                  ? 'text-cyan-300 bg-cyan-400/10 border border-cyan-400/20 hover:bg-cyan-400/20'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">{sidebarContent}</div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative z-50 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
