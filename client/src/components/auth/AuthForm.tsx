'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';

export function AuthForm() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else {
        const { error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
              <LogIn className="h-7 w-7 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">
              {isLogin ? t('auth.login') : t('auth.register')}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {isLogin ? 'Welcome back to NexusCore' : 'Create your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                {t('auth.email')}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-white/[0.08] bg-white/[0.04] text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-cyan-500/30"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                {t('auth.password')}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-white/[0.08] bg-white/[0.04] text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-cyan-500/30"
                placeholder="Min. 6 characters"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isLogin ? (
                <LogIn className="mr-2 h-4 w-4" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isLogin ? t('auth.login') : t('auth.register')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-zinc-500 transition-colors hover:text-cyan-400"
            >
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <span className="font-medium text-cyan-400">
                {isLogin ? t('auth.register') : t('auth.login')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

