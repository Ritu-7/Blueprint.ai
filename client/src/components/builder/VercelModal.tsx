'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Rocket, ExternalLink, CheckCircle2, AlertCircle, Loader2, Key, Globe
} from 'lucide-react';
import type { ProjectFile } from '@/types/project';
import { toast } from 'sonner';

export function VercelModal({
  isOpen,
  onClose,
  projectName = 'blueprint-app',
  files,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  files: ProjectFile[];
  onSuccess?: (url: string) => void;
}) {
  const [token, setToken] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState<string | null>(null);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem('vercel_token') || '';
      setToken(savedToken);
      setDeployedUrl(null);
      setErrorMsg(null);
      setDeployStep(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeploy = async () => {
    if (token) {
      localStorage.setItem('vercel_token', token.trim());
    }

    setIsDeploying(true);
    setErrorMsg(null);
    setDeployStep('Preparing project files & dependencies...');

    try {
      setDeployStep('Sending application payload to Vercel API...');

      const res = await fetch('/api/deploy/vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          files,
          vercelToken: token.trim() || undefined,
        }),
      });

      const responseJson = await res.json();

      if (!res.ok || !responseJson.success) {
        const msg =
          responseJson.error ||
          responseJson.message ||
          'Failed to trigger Vercel deployment.';
        throw new Error(msg);
      }

      const data = responseJson.data;
      const url = data.url || (data.rawUrl ? `https://${data.rawUrl}` : null);

      if (url) {
        setDeployedUrl(url);
        setDeployStep('Live deployment created successfully!');
        toast.success(`Deployed to Vercel: ${url}`);
        if (onSuccess) onSuccess(url);
      } else {
        throw new Error('Vercel API did not return a valid deployment URL');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deployment error';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d14] p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Deploy to Vercel</h3>
            <p className="text-xs text-white/50">One-click live Next.js edge deployment</p>
          </div>
        </div>

        {/* Success State */}
        {deployedUrl ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
              <h4 className="mt-2 text-sm font-bold text-emerald-200">Deployment Live!</h4>
              <p className="mt-1 text-xs text-white/60">
                Your application is live and accessible on Vercel Edge.
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-cyan-300 select-all">
                <Globe className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                <span className="truncate">{deployedUrl}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={deployedUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 py-2.5 text-xs font-black text-black hover:bg-cyan-300 transition-colors"
              >
                <span>Visit Live App</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-white/70">
                <span className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-cyan-400" />
                  Vercel API Token
                </span>
                <span className="text-[10px] text-white/40">Optional if set in .env</span>
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your Vercel Token (ver_...)"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-mono text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-white/40">
                Generate token in Vercel Dashboard → Account Settings → Tokens.
              </p>
            </div>

            {/* Status / Error display */}
            {isDeploying && (
              <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3 text-xs text-cyan-200">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
                <span className="truncate">{deployStep}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span className="truncate">{errorMsg}</span>
              </div>
            )}

            {/* Deploy Action Button */}
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-xs font-black text-black disabled:opacity-40 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-400/20"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deploying to Vercel...</span>
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  <span>Deploy Now ({files.length} files)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
