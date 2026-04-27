'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import '@/lib/i18n';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {});

    return () => subscription.unsubscribe();
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
