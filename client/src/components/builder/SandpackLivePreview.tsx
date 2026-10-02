'use client';

import { useMemo } from 'react';
import { SandpackProvider, SandpackPreview, useSandpack } from '@codesandbox/sandpack-react';
import type { ProjectFile } from '@/types/project';
import { AlertTriangle, Sparkles, Loader2 } from 'lucide-react';

interface SandpackLivePreviewProps {
  files: ProjectFile[];
  activeFile?: ProjectFile;
  entryFile?: string;
  onFixWithAI?: (error: string, offendingFile?: string) => void;
  isStreaming?: boolean;
  buildingFile?: string | null;
}

// React 18 is pinned: the react-ts template ships React 19, which breaks recharts 2.x / lucide 0.3xx peers.
const DEPENDENCIES = {
  react: '^18.2.0',
  'react-dom': '^18.2.0',
  'lucide-react': '0.383.0',
  'framer-motion': '11.2.10',
  recharts: '2.12.7',
  clsx: '2.1.1',
  'tailwind-merge': '2.3.0',
};

// The react-ts template boots from /index.tsx and imports ./App from the ROOT, so files must live at the root.
const INDEX_TSX = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);
`;

const DEFAULT_CSS = `html, body, #root { min-height: 100%; }
body { margin: 0; background: #0b0f17; color: #fff; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
`;

const NON_PREVIEW =
  /(^|\/)(package\.json|tsconfig[^/]*\.json|next\.config\.\w+|tailwind\.config\.\w+|postcss\.config\.\w+)$|\.(sql|md)$|^(supabase|docs)\//i;

/** "src/App.tsx" -> "/App.tsx" so Sandpack's template entry actually loads the AI's app. */
export function toSandpackFiles(files: ProjectFile[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of files) {
    let p = f.path.replace(/^\/+/, '');
    if (NON_PREVIEW.test(p) || !/\.(tsx?|jsx?|css|json)$/i.test(p)) continue;
    if (p.startsWith('src/')) p = p.slice(4);
    map['/' + p] = f.content ?? '';
  }

  // Legacy projects created from the old Next.js templates
  if (!map['/App.tsx'] && !map['/App.jsx']) {
    const page = map['/app/page.tsx'] ?? map['/page.tsx'];
    if (page !== undefined) map['/App.tsx'] = page.replace(/^\s*['"]use client['"];?\s*\n?/gm, '');
  }

  // Entry is always ours so a bad generation can't break bootstrapping
  map['/index.tsx'] = INDEX_TSX;
  if (!map['/styles.css']) map['/styles.css'] = DEFAULT_CSS;
  return map;
}

function ErrorBannerOverlay({
  onFixWithAI,
}: {
  onFixWithAI?: (error: string, offendingFile?: string) => void;
}) {
  const { sandpack } = useSandpack();
  const error = sandpack.error;
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || String(error);
  const offendingPath = (error as { path?: string })?.path;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-40 flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-[#0f172a]/95 p-3.5 text-white shadow-2xl backdrop-blur-md">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-300">Compilation / Runtime Error</p>
          <pre className="mt-1 max-h-16 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-rose-100">
            {errorMessage}
          </pre>
        </div>
      </div>
      {onFixWithAI && (
        <button
          onClick={() => onFixWithAI(errorMessage, offendingPath)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-black text-black shadow-[0_0_12px_rgba(0,243,255,0.3)] transition hover:bg-cyan-300 active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Fix with AI
        </button>
      )}
    </div>
  );
}

export function SandpackLivePreview({
  files = [],
  onFixWithAI,
  isStreaming,
  buildingFile,
}: SandpackLivePreviewProps) {
  const sandpackFiles = useMemo(() => toSandpackFiles(files), [files]);
  const hasApp = !!(sandpackFiles['/App.tsx'] || sandpackFiles['/App.jsx']);

  if (!hasApp) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#05070a] p-6 text-center">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-white/30">Preview Idle</p>
        <p className="mt-2 text-xs text-white/20">No src/App.tsx yet. Generate a project to see the live preview.</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[300px] w-full flex-1 flex-col overflow-hidden bg-[#05070a]">
      {isStreaming && (
        <div className="z-30 flex items-center gap-2 border-b border-cyan-500/20 bg-cyan-950/40 px-4 py-2 text-xs font-bold text-cyan-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Generating project code... {buildingFile ? `Building ${buildingFile}` : ''}</span>
        </div>
      )}

      <SandpackProvider
        template="react-ts"
        theme="dark"
        files={sandpackFiles}
        customSetup={{ dependencies: DEPENDENCIES }}
        options={{
          externalResources: ['https://cdn.tailwindcss.com'],
          recompileMode: 'delayed',
          recompileDelay: 300,
        }}
        style={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      >
        <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
          <SandpackPreview
            showNavigator={false}
            showOpenInCodeSandbox={false}
            showRefreshButton
            style={{ height: '100%', width: '100%', flex: 1 }}
          />
          <ErrorBannerOverlay onFixWithAI={onFixWithAI} />
        </div>
      </SandpackProvider>
    </div>
  );
}
