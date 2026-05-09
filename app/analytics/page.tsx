'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react';

const data = [
  { name: 'Jan', projects: 12, tokens: 4500 },
  { name: 'Feb', projects: 19, tokens: 6200 },
  { name: 'Mar', projects: 15, tokens: 5100 },
  { name: 'Apr', projects: 22, tokens: 8400 },
  { name: 'May', projects: 30, tokens: 12000 },
  { name: 'Jun', projects: 25, tokens: 9500 },
];

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="container mx-auto py-12 px-4 space-y-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
          <BarChart3 className="h-6 w-6 text-cyan-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">System Analytics</h1>
          <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">Usage & Performance Metrics</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Total Deployments</p>
              <h3 className="text-2xl font-black text-white">124</h3>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Growth Rate</p>
              <h3 className="text-2xl font-black text-white">+24%</h3>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Active Users</p>
              <h3 className="text-2xl font-black text-white">1,280</h3>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">API Uptime</p>
              <h3 className="text-2xl font-black text-white">99.9%</h3>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Deployments Over Time</h3>
          <div className="h-[320px] min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff30" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff30" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#05070a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                    itemStyle={{ color: '#00f3ff' }}
                  />
                  <Bar dataKey="projects" fill="#00f3ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </GlassCard>

        <GlassCard className="h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Resource Consumption</h3>
          <div className="h-[320px] min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff30" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff30" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#05070a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                    itemStyle={{ color: '#00f3ff' }}
                  />
                  <Area type="monotone" dataKey="tokens" stroke="#00f3ff" fillOpacity={1} fill="url(#colorTokens)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
