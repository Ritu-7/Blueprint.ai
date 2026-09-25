import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ClientProviders } from "@/components/ClientProviders";
import { AppChrome } from "@/components/AppChrome";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blueprint.ai",
  description: "Generate beautiful full-stack applications with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ClientProviders>
            <AppChrome>{children}</AppChrome>
          </ClientProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
