'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Loader2, LayoutDashboard, Users, FolderKanban, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useUserRole } from '@/hooks/useUserRole';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
] as const;

// ─── Spinner ─────────────────────────────────────────────────────────────────

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0d14]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
          <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400/70">
          Verifying access…
        </p>
      </div>
    </div>
  );
}

// ─── Sidebar nav ─────────────────────────────────────────────────────────────

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0d14]">
      {/* Logo / Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/[0.06] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500 shadow-[0_0_12px_rgba(0,243,255,0.4)]">
          <Zap className="h-4 w-4 text-[#05070a]" />
        </div>
        <span className="text-sm font-black tracking-tighter text-white">
          BLUEPRINT<span className="text-cyan-400">.AI</span>
        </span>
        <span className="ml-auto rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-400">
          Admin
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          // Exact match for /admin, prefix match for sub-routes
          const isActive =
            href === '/admin' ? pathname === '/admin' : (pathname ?? '').startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all',
                isActive
                  ? 'bg-cyan-400/10 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]'
                  : 'text-white/50 hover:bg-white/[0.04] hover:text-white',
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-cyan-400' : 'text-white/40')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: admin badge + user button */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-7 w-7 border border-cyan-500/40',
              },
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-cyan-400 shrink-0" />
              <span className="truncate text-[11px] font-black uppercase tracking-wider text-cyan-400">
                Admin
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== 'admin') {
      router.replace('/');
    }
  }, [loading, role, router]);

  // Show spinner while checking — never flash admin content before the check resolves
  if (loading || role !== 'admin') return <FullPageSpinner />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0d14] text-white">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
