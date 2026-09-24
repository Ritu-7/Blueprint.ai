'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { Sparkles, LayoutDashboard, Hammer, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/utils/utils';

export function TopNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Builder', href: '/builder', icon: Hammer },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className="h-[64px] shrink-0 border-b border-white/[0.06] bg-[#0a0d14] px-6 flex items-center justify-between select-none z-30">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-black font-black text-sm shadow-[0_0_15px_rgba(0,243,255,0.4)] group-hover:scale-105 transition-transform">
          B
        </div>
        <span className="font-black text-base tracking-tight text-white flex items-center gap-1">
          BLUEPRINT<span className="text-cyan-400">.AI</span>
        </span>
      </Link>

      {/* Centered Nav Tabs */}
      <nav className="flex items-center gap-8 h-full">
        {navItems.map((item) => {
          const currentPath = pathname ?? '';
          const isActive = currentPath === item.href || (item.href === '/builder' && currentPath.includes('/builder'));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-2 h-full text-xs font-bold transition-colors duration-150 relative border-b-2 px-1',
                isActive
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-white/50 hover:text-white border-transparent'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-cyan-400' : 'text-white/40')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Avatar */}
      <div className="flex items-center gap-3">
        {user ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8 rounded-full border border-cyan-400/30 hover:border-cyan-400 transition-colors',
              },
            }}
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-xs font-bold text-cyan-300">
            U
          </div>
        )}
      </div>
    </header>
  );
}
