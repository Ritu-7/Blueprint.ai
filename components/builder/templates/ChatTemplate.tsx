import { Bot, Send } from 'lucide-react';

export function ChatTemplate({ title }: { title: string }) {
  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white">
      <section className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Channels</p>
          {['Launch team', 'Support queue', 'Design partners'].map((channel) => (
            <div key={channel} className="mb-2 rounded-xl bg-white/[0.04] p-3 text-sm text-white/70">{channel}</div>
          ))}
        </aside>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <div className="mt-6 space-y-3">
            <div className="max-w-xl rounded-2xl bg-white/[0.05] p-4 text-sm text-white/70">Can you summarize the deployment blockers?</div>
            <div className="ml-auto max-w-xl rounded-2xl bg-cyan-400/15 p-4 text-sm text-cyan-50"><Bot className="mb-2 h-4 w-4" /> Three blockers found: schema migration, auth redirect, preview QA.</div>
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <span className="flex-1 text-sm text-white/35">Ask the workspace...</span>
            <Send className="h-4 w-4 text-cyan-300" />
          </div>
        </section>
      </section>
    </main>
  );
}
