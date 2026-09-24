'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full items-center justify-center p-6">
          <GlassCard className="max-w-md p-8 text-center border-red-500/30 bg-red-950/20 space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-lg font-black text-white">Something went wrong</h2>
            <p className="text-xs text-white/60 leading-relaxed">
              An unexpected UI component error occurred. The application state has been preserved.
            </p>
            {this.state.error && (
              <pre className="text-[10px] font-mono text-red-300/80 bg-black/40 border border-red-500/20 p-3 rounded-lg overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-black hover:bg-cyan-300 transition"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
