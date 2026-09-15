import Link from 'next/link';
import { Zap, Code, MessageSquare, Share2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-background/80 backdrop-blur-md overflow-hidden">
      {/* Subtle Glow Overlay */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-cyan-500/5 blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-transform group-hover:scale-110 duration-500">
                <Zap className="h-6 w-6 text-background" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white uppercase">
                BLUEPRINT<span className="text-cyan-500 drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">.AI</span>
              </span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs font-medium">
              Architecting the future of software development with autonomous AI generation.
            </p>
          </div>

          {/* Product Links */}
          <div className="lg:pl-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-8 flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-cyan-500 shadow-[0_0_5px_#00f3ff]" />
              Product
            </h4>
            <ul className="space-y-4 text-sm font-bold">
              <li>
                <Link href="/builder" className="text-white/30 hover:text-white transition-all hover:drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] flex items-center gap-2 group">
                  <span className="h-px w-0 bg-cyan-500 group-hover:w-4 transition-all duration-300" />
                  Builder
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-white/30 hover:text-white transition-all hover:drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] flex items-center gap-2 group">
                  <span className="h-px w-0 bg-cyan-500 group-hover:w-4 transition-all duration-300" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-white/30 hover:text-white transition-all hover:drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] flex items-center gap-2 group">
                  <span className="h-px w-0 bg-cyan-500 group-hover:w-4 transition-all duration-300" />
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-white/30 hover:text-white transition-all hover:drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] flex items-center gap-2 group">
                  <span className="h-px w-0 bg-cyan-500 group-hover:w-4 transition-all duration-300" />
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-8 flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-cyan-500 shadow-[0_0_5px_#00f3ff]" />
              Resources
            </h4>
            <ul className="space-y-4 text-sm font-bold">
              <li>
                <Link href="/docs" className="text-white/30 hover:text-white transition-all hover:drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] flex items-center gap-2 group">
                  <span className="h-px w-0 bg-cyan-500 group-hover:w-4 transition-all duration-300" />
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="text-white/30 hover:text-white transition-all hover:drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] flex items-center gap-2 group">
                  <span className="h-px w-0 bg-cyan-500 group-hover:w-4 transition-all duration-300" />
                  API Terminal
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-white/30 hover:text-white transition-all hover:drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] flex items-center gap-2 group">
                  <span className="h-px w-0 bg-cyan-500 group-hover:w-4 transition-all duration-300" />
                  Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/30 hover:text-white transition-all hover:drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] flex items-center gap-2 group">
                  <span className="h-px w-0 bg-cyan-500 group-hover:w-4 transition-all duration-300" />
                  Privacy Protocol
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect Section */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-8 flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-cyan-500 shadow-[0_0_5px_#00f3ff]" />
              Connect
            </h4>
            <div className="flex gap-4">
              <Link 
                href="#" 
                className="h-12 w-12 rounded-xl glass flex items-center justify-center text-white/30 hover:text-cyan-500 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-500"
              >
                <Code className="h-5 w-5" />
              </Link>
              <Link 
                href="#" 
                className="h-12 w-12 rounded-xl glass flex items-center justify-center text-white/30 hover:text-cyan-500 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-500"
              >
                <Share2 className="h-5 w-5" />
              </Link>
              <Link 
                href="#" 
                className="h-12 w-12 rounded-xl glass flex items-center justify-center text-white/30 hover:text-cyan-500 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-500"
              >
                <MessageSquare className="h-5 w-5" />
              </Link>
            </div>
            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
              NexusNode-01 Southeast
            </p>
          </div>
        </div>

        {/* Global Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-12 shadow-[0_0_20px_rgba(0,243,255,0.1)]" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.4em]">
          <p className="text-white/20 flex items-center gap-3">
            <span className="h-1 w-1 rounded-full bg-white/20" />
            © 2026 BLUEPRINT.AI. ALL RIGHTS RESERVED.
          </p>
          <p className="text-cyan-500 drop-shadow-[0_0_10px_rgba(0,243,255,0.4)] flex items-center gap-3">
            <span className="h-1 w-1 rounded-full bg-cyan-500 animate-pulse" />
            SYSTEM OPERATIONAL // BUILT WITH AI
          </p>
        </div>
      </div>
    </footer>
  );
}

