'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * AppChrome
 *
 * Conditionally wraps children with the global Navbar + Footer shell.
 *
 * IDE routes (/builder and /projects/...) are full-viewport, fixed-height
 * layouts that provide their own navigation chrome (TopNav, ProjectHeader,
 * ProjectSidebar). Wrapping them in Navbar + Footer would:
 *   - add an extra 64px navbar above the IDE
 *   - add a Footer that forces page-level scroll, breaking the h-screen layout
 *
 * All other routes (marketing, dashboard, settings, etc.) get the normal
 * Navbar + Footer shell unchanged.
 */

const IDE_PREFIXES = ['/builder', '/projects', '/admin'];

function isIdeRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return IDE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isIdeRoute(pathname)) {
    // IDE routes: render children as-is, no Navbar or Footer
    return <>{children}</>;
  }

  // All other routes: standard shell
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
