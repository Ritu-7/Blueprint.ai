import './globals.css';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ClientProviders } from '@/components/ClientProviders';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Blueprint.ai | Build Apps with AI',
  description: 'Cyberpunk-Minimalist AI App Builder Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark scroll-smooth">
        <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-cyan-500/30 selection:text-cyan-500">
          <ClientProviders>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </ClientProviders>
          <Toaster richColors closeButton theme="dark" />
        </body>
      </html>
    </ClerkProvider>
  );
}

