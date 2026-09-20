'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  ChevronRight,
  ChevronsUpDown,
  Menu,
  Sparkles,
  Plus,
  Zap,
} from 'lucide-react';
import { useProject } from './ProjectContext';
import { navSections } from './ProjectSidebar';

interface ProjectHeaderProps {
  projectId: string;
  onMobileMenuToggle?: () => void;
}

export function ProjectHeader({ projectId, onMobileMenuToggle }: ProjectHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { project, projectsList } = useProject();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const safePathname = pathname || '';
  const activeSection = navSections.find((item) => safePathname.endsWith(item.href))?.name || 'Overview';

  const handleProjectSwitch = (targetProjectId: string) => {
    setIsDropdownOpen(false);
    // Determine section suffix or default to overview
    const currentSuffix = navSections.find((item) => safePathname.endsWith(item.href))?.href || '/overview';
    router.push(`/projects/${targetProjectId}${currentSuffix}`);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#05070a]/90 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5 hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Project Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white hover:border-cyan-400/40 hover:bg-white/[0.08] transition-all"
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span className="max-w-[140px] truncate">{project?.name || 'Select Project'}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-white/40" />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 z-50 w-64 rounded-xl border border-white/10 bg-[#0c1017] p-2 shadow-2xl backdrop-blur-xl">
              <div className="mb-2 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white/40">
                Switch Project
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {projectsList.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProjectSwitch(p.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors ${
                      p.id === projectId
                        ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-white/30 uppercase">{p.kind || 'app'}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 border-t border-white/10 pt-2">
                <Link
                  href="/builder"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 px-3 py-2 text-xs font-black uppercase tracking-widest text-cyan-300 hover:bg-cyan-400/20"
                >
                  <Plus className="h-3.5 w-3.5" /> New Project
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Breadcrumbs */}
        <nav className="hidden items-center gap-2 text-xs font-bold text-white/40 sm:flex">
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-white/80">{activeSection}</span>
        </nav>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${projectId}/builder`}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-3.5 py-1.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,243,255,0.25)]"
        >
          <Sparkles className="h-3.5 w-3.5" /> Open IDE
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,243,255,0.2)]',
            },
          }}
        />
      </div>
    </header>
  );
}
