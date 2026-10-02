'use client';

import { useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  useSandpack,
} from '@codesandbox/sandpack-react';
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

function ErrorBannerOverlay({
  onFixWithAI,
}: {
  onFixWithAI?: (error: string, offendingFile?: string) => void;
}) {
  const { sandpack } = useSandpack();
  const error = sandpack.error;

  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || String(error);
  const offendingPath = (error as any)?.path;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-40 flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-[#0f172a]/95 p-3.5 text-white shadow-2xl backdrop-blur-md">
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-300">Compilation / Runtime Error</p>
          <pre className="mt-1 text-xs text-rose-100 whitespace-pre-wrap font-mono max-h-16 overflow-y-auto">
            {errorMessage}
          </pre>
        </div>
      </div>
      {onFixWithAI && (
        <button
          onClick={() => onFixWithAI(errorMessage, offendingPath)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-black text-black hover:bg-cyan-300 transition shadow-[0_0_12px_rgba(0,243,255,0.3)] active:scale-95"
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
  // Convert ProjectFile[] into Sandpack's files format
  const sandpackFiles = useMemo(() => {
    const map: Record<string, string> = {};

    let hasAppTsx = false;

    files.forEach((f) => {
      let path = f.path.startsWith('/') ? f.path : `/${f.path}`;
      if (path === '/src/App.tsx' || path === '/App.tsx') hasAppTsx = true;
      map[path] = f.content || '';
    });

    // If user provided app/page.tsx instead of src/App.tsx, map page.tsx to /src/App.tsx for Sandpack
    if (!hasAppTsx) {
      const pageFile = files.find((f) => f.path.endsWith('page.tsx'));
      if (pageFile) {
        let code = pageFile.content || '';
        code = code.replace(/^\s*['"]use client['"];?\s*\n?/gm, '');
        map['/src/App.tsx'] = code;
      }
    }

    // Default main entry if missing
    if (!map['/src/index.tsx'] && !map['/src/main.tsx']) {
      map['/src/index.tsx'] = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);`;
    }

    return map;
  }, [files]);

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-[#05070a]">
      {/* Streaming indicator banner */}
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
        customSetup={{
          dependencies: {
            'lucide-react': '^0.400.0',
            'framer-motion': '^11.0.0',
            recharts: '^2.12.0',
            clsx: '^2.1.0',
            'tailwind-merge': '^2.3.0',
          },
        }}
        options={{
          externalResources: ['https://cdn.tailwindcss.com'],
          recompileMode: 'delayed',
          recompileDelay: 300,
        }}
      >
        <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
          <SandpackPreview
            showNavigator={false}
            showOpenInCodeSandbox={false}
            showRefreshButton={true}
            style={{ height: '100%', width: '100%', flex: 1 }}
          />
          <ErrorBannerOverlay onFixWithAI={onFixWithAI} />
        </div>
      </SandpackProvider>
    </div>
  );
}
