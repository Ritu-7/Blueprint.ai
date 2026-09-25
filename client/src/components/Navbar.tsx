'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { LayoutDashboard, Hammer, BarChart3, Settings, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/utils';
import { useUserRole } from '@/hooks/useUserRole';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Builder', href: '/builder', icon: Hammer },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const { role } = useUserRole();
  const { isLoaded, isSignedIn } = useUser();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 shadow-[0_0_15px_rgba(0,243,255,0.5)]">
            <Zap className="h-5 w-5 text-background" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">
            BLUEPRINT<span className="text-cyan-500">.AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-white/5",
                pathname === item.href 
                  ? "text-cyan-500 shadow-[inset_0_-2px_0_0_#00f3ff]" 
                  : "text-white/60 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
          {role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-white/5",
                (pathname ?? '').startsWith('/admin')
                  ? "text-cyan-500 shadow-[inset_0_-2px_0_0_#00f3ff]" 
                  : "text-white/60 hover:text-white"
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isLoaded && isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]"
                }
              }}
            />
          ) : isLoaded ? (
            <SignInButton mode="modal">
              <button className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-bold text-background shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(0,243,255,0.5)]">
                Sign In
              </button>
            </SignInButton>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

