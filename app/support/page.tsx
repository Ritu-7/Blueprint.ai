'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSuccess(true);
      toast.success('Support request transmitted successfully.');
      setFormData({ name: '', email: '', message: '' });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-6 max-w-4xl">
      <div className="text-center mb-16">
        <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mx-auto mb-6 shadow-[0_0_30px_rgba(0,243,255,0.1)]">
          <MessageSquare className="h-8 w-8 text-cyan-500" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">Support Terminal</h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto font-medium">
          Experience technical difficulties or need architectural advice? Contact our support unit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
        <div className="md:col-span-3">
          {success ? (
            <GlassCard className="py-16 text-center border-green-500/20 bg-green-500/5">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white uppercase tracking-tighter mb-2">Transmission Received</h2>
              <p className="text-white/60 mb-8">Our operators will process your request shortly.</p>
              <button 
                onClick={() => setSuccess(false)}
                className="text-cyan-500 text-xs font-black uppercase tracking-[0.2em] hover:drop-shadow-[0_0_5px_#00f3ff]"
              >
                Send Another Transmission
              </button>
            </GlassCard>
          ) : (
            <GlassCard>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1">Operator Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter full name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:border-cyan-500/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1">Identity (Email)</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="name@nexus.core"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:border-cyan-500/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1">Message Protocol</label>
                  <textarea 
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Describe the issue or request..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:border-cyan-500/50 outline-none transition-all resize-none"
                  />
                </div>
                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full bg-cyan-500 text-background font-black uppercase tracking-[0.2em] py-4 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.2)] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(0,243,255,0.4)] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-background/30 border-t-background animate-spin rounded-full" />
                  ) : (
                    <>
                      Transmit Request
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </GlassCard>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="text-white font-bold uppercase tracking-tighter mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-cyan-500" />
              Response Time
            </h3>
            <p className="text-sm text-white/50 leading-relaxed font-medium">
              Priority Tier: 1-2 Hours<br />
              Standard Tier: 24 Hours
            </p>
          </GlassCard>

          <GlassCard className="border-cyan-500/10">
            <h3 className="text-white font-bold uppercase tracking-tighter mb-4">Direct Comm</h3>
            <p className="text-sm text-white/50 font-medium">
              ops@blueprint.ai<br />
              hq@blueprint.ai
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
