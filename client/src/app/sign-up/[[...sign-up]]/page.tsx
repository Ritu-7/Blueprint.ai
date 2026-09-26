'use client';

import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { motion } from 'framer-motion';
import { Bot, Code2, Database, Zap } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI Architect',
    body: 'Prompt-to-project generation with files, schema, routes, and live preview.',
  },
  {
    icon: Code2,
    title: 'IDE Workspace',
    body: 'Explore generated folders, inspect code, and iterate like a pro.',
  },
  {
    icon: Database,
    title: 'Backend Ready',
    body: 'Supabase SQL and API contracts generated automatically with every app.',
  },
];

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen bg-[#0a0d14]">
      {/* ── Left branded panel (hidden on mobile) ── */}
      <motion.aside
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/[0.06] bg-[#0a0d14]"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            <Zap className="h-5 w-5 text-[#0a0d14]" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">
            BLUEPRINT<span className="text-cyan-400">.AI</span>
          </span>
        </div>

        {/* Hero copy */}
        <div className="space-y-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Free to Start, Pro when you Ship
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
              Your AI app workspace<br />
              <span className="text-cyan-400">starts here</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/50">
              Unlimited local generation, project history, Supabase persistence, and deployment workflows designed for real teams.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-5">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10">
                  <f.icon className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-white/45">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer quote */}
        <p className="text-xs text-white/25 leading-5">
          &ldquo;The generated schema and route docs saved a full planning cycle.&rdquo;
        </p>
      </motion.aside>

      {/* ── Right form panel ── */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
        className="flex flex-1 items-center justify-center p-6 sm:p-12"
      >
        <SignUp
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#22d3ee',
              colorBackground: '#0f131c',
              colorInputBackground: '#161b27',
              colorInputText: '#ffffff',
              colorText: '#ffffff',
              colorTextSecondary: 'rgba(255,255,255,0.5)',
              colorTextOnPrimaryBackground: '#0a0d14',
              borderRadius: '0.75rem',
              fontFamily: 'inherit',
            },
            elements: {
              rootBox: 'w-full max-w-md',
              card: 'bg-[#0f131c] border border-white/10 shadow-none rounded-2xl',
              headerTitle: 'text-white font-black tracking-tight',
              headerSubtitle: 'text-white/45',
              socialButtonsBlockButton:
                'border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] transition-colors',
              socialButtonsBlockButtonText: 'text-white font-medium',
              dividerLine: 'bg-white/10',
              dividerText: 'text-white/30',
              formFieldLabel: 'text-white/60 text-xs font-semibold uppercase tracking-wide',
              formFieldInput:
                'bg-[#161b27] border border-white/10 text-white rounded-xl focus:border-cyan-400 focus:ring-0 focus:ring-offset-0 placeholder:text-white/25 transition-colors',
              formButtonPrimary:
                'bg-cyan-400 text-[#0a0d14] font-black hover:bg-cyan-300 active:bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all rounded-xl',
              footerActionLink: 'text-cyan-400 hover:text-cyan-300 font-semibold',
              identityPreviewText: 'text-white/70',
              identityPreviewEditButton: 'text-cyan-400 hover:text-cyan-300',
              alert: 'bg-red-500/10 border border-red-500/20 text-red-300',
              alertText: 'text-red-300',
            },
          }}
        />
      </motion.main>
    </div>
  );
}
