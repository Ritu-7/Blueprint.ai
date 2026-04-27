'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { SectionRenderer } from '@/components/engine/DynamicRenderer';
import { ErrorBoundary } from '@/components/engine/ErrorBoundary';
import { validateConfig } from '@/config/schema';
import { ErrorCard } from '@/components/engine/ErrorCard';
import type { AppConfig } from '@/config/schema';
import appConfigJson from '@/config/appConfig.json';
import {
  LayoutDashboard,
  LogOut,
  Globe,
  Cpu,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [configErrors, setConfigErrors] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth');
        return;
      }
      setUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    const result = validateConfig(appConfigJson);
    if (result.success && result.data) {
      setConfig(result.data);
      setConfigErrors([]);
    } else {
      setConfig(null);
      setConfigErrors(result.errors?.errors.map((e) => e.message) || ['Invalid configuration']);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  if (!user || (!config && configErrors.length === 0)) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const page = config?.layout.pages[0];
  const supportedLangs = config?.metadata.supportedLanguages || ['en'];

  return (
    <div className="min-h-screen bg-zinc-950 grid-bg">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20">
              <Cpu className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-100">
              <span className="text-cyan-400 neon-text">Nexus</span>Core
            </span>
            <span className="hidden items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400 ring-1 ring-cyan-500/20 sm:inline-flex">
              <Zap className="h-3 w-3" />
              Live
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="hidden items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 sm:flex">
              {supportedLangs.map((lang) => (
                <button
                  key={lang}
                  onClick={() => switchLanguage(lang)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                    i18n.language === lang
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <Globe
              className="h-4 w-4 cursor-pointer text-zinc-600 transition-colors hover:text-cyan-400 sm:hidden"
              onClick={() => {
                const next = supportedLangs[(supportedLangs.indexOf(i18n.language) + 1) % supportedLangs.length];
                switchLanguage(next);
              }}
            />

            <div className="hidden h-5 w-px bg-white/[0.06] sm:block" />

            <span className="hidden text-xs text-zinc-500 sm:block">
              {user.email}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-zinc-500 hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {configErrors.length > 0 ? (
          <ErrorCard
            componentType="AppConfig"
            errors={configErrors}
            missingProps={[]}
          />
        ) : page ? (
          <div className="space-y-8">
            {/* Page header */}
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5 text-cyan-400" />
              <h1 className="text-xl font-bold text-zinc-100">{page.title}</h1>
            </div>

            {/* Sections */}
            {page.sections.map((section) => (
              <ErrorBoundary key={section.id} componentId={section.id} componentType="Section">
                <SectionRenderer section={section} />
              </ErrorBoundary>
            ))}
          </div>
        ) : (
          <ErrorCard
            componentType="Layout"
            errors={['No pages defined in the configuration']}
            missingProps={['pages']}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 text-center text-xs text-zinc-700">
        Powered by NexusCore Low-Code Engine &middot; JSON Blueprint Driven
      </footer>
    </div>
  );
}
