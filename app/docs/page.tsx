'use client';

import { GlassCard } from '@/components/GlassCard';
import { Book, Rocket, Hammer, Terminal, ChevronRight } from 'lucide-react';

const sections = [
  { id: 'getting-started', title: 'Getting Started', icon: Rocket },
  { id: 'builder-usage', title: 'Builder Usage', icon: Hammer },
  { id: 'api-usage', title: 'API Usage', icon: Terminal },
];

export default function DocsPage() {
  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-24 space-y-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-6 px-4">Documentation</h2>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all group"
              >
                <section.icon className="h-4 w-4 group-hover:text-cyan-500 transition-colors" />
                {section.title}
              </a>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 max-w-4xl space-y-24 pb-32">
          {/* Hero */}
          <header>
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mb-6">
              <Book className="h-6 w-6 text-cyan-500" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">Core Protocols</h1>
            <p className="text-lg text-white/50 leading-relaxed">
              Welcome to the Blueprint.ai technical documentation. Master the tools to architect autonomous applications.
            </p>
          </header>

          {/* Getting Started */}
          <section id="getting-started" className="scroll-mt-32">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-8 flex items-center gap-4">
              <span className="text-cyan-500">01</span> Getting Started
            </h2>
            <div className="prose prose-invert max-w-none space-y-6 text-white/60">
              <p>To begin your journey with Blueprint.ai, ensure you have a verified account through our secure authentication layer.</p>
              <GlassCard className="border-cyan-500/20">
                <h3 className="text-white font-bold mb-2">Quick Protocol:</h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Authenticate via the <span className="text-cyan-500 font-mono">Sign In</span> terminal.</li>
                  <li>Navigate to the <span className="text-cyan-500 font-mono">Builder</span> interface.</li>
                  <li>Initialize your first prompt sequence.</li>
                </ol>
              </GlassCard>
            </div>
          </section>

          {/* Builder Usage */}
          <section id="builder-usage" className="scroll-mt-32">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-8 flex items-center gap-4">
              <span className="text-cyan-500">02</span> Builder Usage
            </h2>
            <div className="prose prose-invert max-w-none space-y-6 text-white/60">
              <p>The AI Architect is capable of interpreting complex architectural requirements. For best results, use descriptive, structured prompts.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard>
                  <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-3">Effective Prompts</h4>
                  <ul className="text-xs space-y-2 opacity-80">
                    <li>"Generate a CRM with lead tracking"</li>
                    <li>"Build a dark-themed analytics portal"</li>
                    <li>"Create a secure file management system"</li>
                  </ul>
                </GlassCard>
                <GlassCard>
                  <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-3">Ineffective Prompts</h4>
                  <ul className="text-xs space-y-2 opacity-80">
                    <li>"Make a website"</li>
                    <li>"App for business"</li>
                    <li>"Cool UI"</li>
                  </ul>
                </GlassCard>
              </div>
            </div>
          </section>

          {/* API Usage */}
          <section id="api-usage" className="scroll-mt-32">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-8 flex items-center gap-4">
              <span className="text-cyan-500">03</span> API Usage
            </h2>
            <div className="prose prose-invert max-w-none space-y-6 text-white/60">
              <p>Integrate Blueprint.ai generation capabilities directly into your existing workflows using our REST API.</p>
              <pre className="p-6 rounded-xl bg-black/40 border border-white/5 text-cyan-500 font-mono text-sm overflow-x-auto">
                <code>{`// POST /api/generate
{
  "prompt": "A crypto dashboard with live charts",
  "options": {
    "theme": "cyberpunk",
    "framework": "nextjs"
  }
}`}</code>
              </pre>
              <div className="flex items-center gap-4 mt-8">
                <a href="/api-docs" className="flex items-center gap-2 text-cyan-500 font-bold uppercase tracking-widest text-xs hover:gap-4 transition-all">
                  View Full API Reference <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
