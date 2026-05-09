'use client';

import { UserProfile } from '@clerk/nextjs';
import { Settings as SettingsIcon, Shield, CreditCard, Link as LinkIcon, Database } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-12 px-4 space-y-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
          <SettingsIcon className="h-6 w-6 text-cyan-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">System Configuration</h1>
          <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">User Profile & Integration Settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <GlassCard className="p-0 overflow-hidden border-none bg-transparent shadow-none">
            <UserProfile 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-white/[0.02] border border-white/5 shadow-none w-full",
                  navbar: "border-r border-white/5 bg-white/[0.01]",
                  headerTitle: "text-white font-black uppercase tracking-tighter",
                  headerSubtitle: "text-white/40",
                  profileSectionTitleText: "text-cyan-500 font-bold uppercase tracking-widest text-xs",
                  button: "text-white hover:bg-white/5",
                  userPreviewMainIdentifier: "text-white font-bold",
                  userPreviewSecondaryIdentifier: "text-white/40",
                }
              }}
            />
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5 text-cyan-500" />
              <h3 className="font-bold uppercase tracking-widest text-xs text-white">Security Status</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-xs text-white/60">Encryption</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-green-500/20 text-green-500">Active</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-xs text-white/60">MFA Status</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-500">Required</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-5 w-5 text-cyan-500" />
              <h3 className="font-bold uppercase tracking-widest text-xs text-white">Supabase Connection</h3>
            </div>
            <p className="text-xs text-white/40 mb-4 leading-relaxed">
              Connected to node-ap-southeast-1. NexusCore persistence layer is operational.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black text-cyan-500 uppercase tracking-widest">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
              Operational
            </div>
          </GlassCard>

          <GlassCard className="border-cyan-500/20 bg-cyan-500/5">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-cyan-500" />
              <h3 className="font-bold uppercase tracking-widest text-xs text-white">Pro Terminal</h3>
            </div>
            <p className="text-xs text-white/60 mb-6 leading-relaxed">
              Unlock unlimited AI generations and custom domain deployments.
            </p>
            <button className="w-full py-3 rounded-lg bg-cyan-500 text-background font-black text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all">
              Upgrade Now
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
