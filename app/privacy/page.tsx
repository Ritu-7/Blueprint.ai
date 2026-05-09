'use client';

import { GlassCard } from '@/components/GlassCard';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

const sections = [
  {
    title: "Data Collection Protocol",
    icon: Eye,
    content: "We collect metadata required to facilitate autonomous application generation. This includes prompt history, identity verification data, and technical specifications provided during architectural sequences."
  },
  {
    title: "Usage Policy",
    icon: FileText,
    content: "Collected data is utilized exclusively to improve the accuracy of our AI models and to maintain the integrity of your deployment dashboard. We do not sell operator data to third-party entities."
  },
  {
    title: "Security & Encryption",
    icon: Lock,
    content: "All architectural transmissions are encrypted using industrial-grade protocols. Your generated code and database schemas are stored in secure, isolated environments managed via Supabase."
  }
];

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-6 max-w-4xl">
      <header className="text-center mb-16">
        <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mx-auto mb-6 shadow-[0_0_30px_rgba(0,243,255,0.1)]">
          <Shield className="h-8 w-8 text-cyan-500" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">Privacy Protocol</h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto font-medium">
          Information security is foundational to the NexusCore mission. Review our operational standards.
        </p>
      </header>

      <div className="space-y-8">
        {sections.map((section, idx) => (
          <GlassCard key={idx} className="flex flex-col md:flex-row gap-6 p-8">
            <div className="h-12 w-12 shrink-0 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-cyan-500">
              <section.icon className="h-6 w-6" />
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">{section.title}</h2>
              <p className="text-white/60 leading-relaxed font-medium">{section.content}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <footer className="mt-16 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
          Last Revision: May 2026 // Protocol V4.2
        </p>
      </footer>
    </div>
  );
}
