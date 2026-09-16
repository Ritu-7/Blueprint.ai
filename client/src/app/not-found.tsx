import Link from 'next/link';
import { ArrowLeft, Compass, Hammer } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#05070a] px-6 py-20 text-white">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300"><Compass className="h-8 w-8" /></div>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.32em] text-cyan-300">Route not found</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">This blueprint is off the map.</h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-white/50">The page may have moved, or the route has not been created yet. Choose a known workspace destination below.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-black text-white/75 transition hover:border-white/35 hover:text-white"><ArrowLeft className="h-4 w-4" /> Home</Link><Link href="/builder" className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-[#05070a] transition hover:bg-cyan-300"><Hammer className="h-4 w-4" /> Open Builder</Link></div>
      </div>
    </main>
  );
}
