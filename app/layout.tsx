import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NexusCore — Low-Code App Generator',
  description: 'A full-stack system that dynamically generates an app based on a JSON Blueprint',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
