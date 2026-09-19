'use client';

import '@/lib/i18n';
import { Toaster } from 'sonner';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster theme="dark" position="bottom-right" richColors />
    </>
  );
}


