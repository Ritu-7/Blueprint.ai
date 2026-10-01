'use client';

import { useState, useEffect, useRef } from 'react';
import { Info, RefreshCw, AlertCircle } from 'lucide-react';
import type { ProjectFile } from '@/types/project';

// Generates a robust standalone HTML document with component execution inlined via Babel standalone
function buildPreviewHTML(files: ProjectFile[]): string {
  const pageFile =
    files.find((f) => f.path === 'app/page.tsx' || f.path === 'page.tsx') ??
    files.find((f) => f.path.endsWith('page.tsx') || f.path.endsWith('page.jsx') || f.path.endsWith('.tsx'));

  if (!pageFile) {
    return `<!DOCTYPE html><html><body style="background:#05070a;color:#fff;font-family:sans-serif;padding:32px;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div style="text-align:center;">
        <h3 style="color:#a1a1aa;font-size:14px;margin:0 0 8px;">No page.tsx found</h3>
        <p style="color:#52525b;font-size:12px;margin:0;">Generate a project to view live preview.</p>
      </div>
    </body></html>`;
  }

  let code = pageFile.content ?? '';

  // 1. Strip Next.js directives
  code = code.replace(/^\s*['"]use (client|server)['"];?\s*\n?/gm, '');

  // 2. Strip import statements as dependencies are provided in global scope
  code = code.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');

  // 3. Detect the default export component name before stripping exports
  let defaultComponentName = 'Page';
  const defaultFnMatch = code.match(/\bexport\s+default\s+function\s+([A-Za-z0-9_]+)/);
  if (defaultFnMatch) defaultComponentName = defaultFnMatch[1];

  // 4. Strip export keywords (keep declarations intact, assign at bottom)
  code = code.replace(/\bexport\s+default\s+function\b/g, 'function');
  code = code.replace(/\bexport\s+default\s+class\b/g, 'class');
  code = code.replace(/\bexport\s+default\s+/g, 'var __defaultExport = ');
  code = code.replace(/\bexport\s+(function|const|let|var|class)\b/g, '$1');

  // 5. Append global export registration at the END (safe — never mid-declaration)
  code += `\n\nwindow.exports.default = typeof ${defaultComponentName} !== 'undefined' ? ${defaultComponentName} : (typeof __defaultExport !== 'undefined' ? __defaultExport : null);`;


  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            accent: '#22d3ee',
            cyan: { 400: '#22d3ee' },
          },
        },
      },
    };
  </script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <script>
    // Global environment setup for Babel & Modules
    window.exports = {};
    window.module = { exports: window.exports };

    // Global error listener to display errors visually instead of blank screen
    window.onerror = function(msg, url, line, col, err) {
      var root = document.getElementById('root');
      if (root) {
        root.innerHTML = '<div style="padding:20px;background:#0f172a;color:#f87171;font-family:monospace;margin:16px;border-radius:12px;border:1px solid #334155;">' +
          '<h4 style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#fca5a5;">Preview Runtime Notice</h4>' +
          '<pre style="margin:0;font-size:11px;white-space:pre-wrap;color:#cbd5e1;">' + (msg || err) + '</pre>' +
        '</div>';
      }
    };
  </script>

  <script>
    // React Hooks global aliases
    const { useState, useEffect, useMemo, useCallback, useRef, useReducer, useContext, createContext } = React;

    // Next.js module stubs
    const Link = ({ href, children, ...props }) => React.createElement('a', { href: href || '#', ...props }, children);
    const Image = ({ src, alt, width, height, ...props }) => React.createElement('img', { src: src || '', alt: alt || '', width, height, ...props });
    const useRouter = () => ({ push: () => {}, replace: () => {}, back: () => {}, forward: () => {} });
    const usePathname = () => '/';
    const useSearchParams = () => new URLSearchParams();

    // Proxy stub for ANY lucide-react icon component
    const LucideIconProxy = new Proxy({}, {
      get: (target, prop) => {
        if (typeof prop !== 'string') return () => null;
        return function DynamicIcon({ className = '', size = 16, style = {}, ...props }) {
          return React.createElement('span', {
            className: 'inline-flex items-center justify-center ' + className,
            style: Object.assign({ display: 'inline-flex', width: size || 16, height: size || 16 }, style),
            ...props
          }, '✦');
        };
      }
    });

    // Explicit icon bindings for templates
    const Search = LucideIconProxy.Search;
    const Sparkles = LucideIconProxy.Sparkles;
    const Plus = LucideIconProxy.Plus;
    const ArrowUpRight = LucideIconProxy.ArrowUpRight;
    const Check = LucideIconProxy.Check;
    const Trash2 = LucideIconProxy.Trash2;
    const Filter = LucideIconProxy.Filter;
    const Star = LucideIconProxy.Star;
    const Shield = LucideIconProxy.Shield;
    const Activity = LucideIconProxy.Activity;
    const X = LucideIconProxy.X;
    const Home = LucideIconProxy.Home;
    const User = LucideIconProxy.User;
    const Settings = LucideIconProxy.Settings;
    const Bell = LucideIconProxy.Bell;
    const Menu = LucideIconProxy.Menu;
    const ChevronDown = LucideIconProxy.ChevronDown;
    const ChevronRight = LucideIconProxy.ChevronRight;
    const Edit = LucideIconProxy.Edit;
    const Eye = LucideIconProxy.Eye;
    const Heart = LucideIconProxy.Heart;
    const Share = LucideIconProxy.Share;
    const Download = LucideIconProxy.Download;
    const Upload = LucideIconProxy.Upload;
  </script>

  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background-color: #05070a; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel" data-presets="react,typescript">
    ${code}

    (function renderApp() {
      try {
        var ComponentToRender = window.exports.default ||
                               (typeof Page !== 'undefined' ? Page : null) ||
                               (typeof App !== 'undefined' ? App : null) ||
                               (typeof main !== 'undefined' ? main : null);

        if (ComponentToRender) {
          var rootElement = document.getElementById('root');
          var root = ReactDOM.createRoot(rootElement);
          root.render(React.createElement(ComponentToRender));
        } else {
          document.getElementById('root').innerHTML =
            '<div style="padding:24px;color:#f87171;font-family:sans-serif;background:#05070a;">' +
            '<h3 style="margin:0 0 8px;font-size:14px;font-weight:bold;">No Component Exported</h3>' +
            '<p style="margin:0;font-size:12px;color:#94a3b8;">Ensure page.tsx exports a default React component.</p>' +
            '</div>';
        }
      } catch (e) {
        console.error("Preview render exception:", e);
        document.getElementById('root').innerHTML =
          '<div style="padding:24px;color:#f87171;font-family:monospace;background:#05070a;">' +
          '<h3 style="margin:0 0 8px;font-size:14px;font-weight:bold;">Render Error</h3>' +
          '<pre style="margin:0;font-size:12px;white-space:pre-wrap;color:#fca5a5;">' + (e.message || String(e)) + '</pre>' +
          '</div>';
      }
    })();
  </script>
</body>
</html>`;
}

export function SandpackLivePreview({
  files,
  activeFile,
}: {
  files: ProjectFile[];
  activeFile?: ProjectFile;
  entryFile?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  // Debounce updates so keystrokes don't thrash
  const [debouncedFiles, setDebouncedFiles] = useState<ProjectFile[]>(files);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFiles(files), 300);
    return () => clearTimeout(t);
  }, [files]);

  // Notice for non-previewable active files
  useEffect(() => {
    if (!activeFile) {
      setNotice(null);
      return;
    }
    const p = activeFile.path.toLowerCase();
    if (p.endsWith('.sql')) setNotice(`"${activeFile.path}" is a SQL database schema — showing app preview below.`);
    else if (p.endsWith('.md')) setNotice(`"${activeFile.path}" is a Markdown file — showing app preview below.`);
    else if (p.endsWith('/route.ts') || p.endsWith('/route.js')) setNotice(`"${activeFile.path}" is an API route — showing app preview below.`);
    else if (p.endsWith('.json')) setNotice(`"${activeFile.path}" is a JSON file — showing app preview below.`);
    else setNotice(null);
  }, [activeFile]);

  // Write HTML to iframe srcdoc
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const html = buildPreviewHTML(debouncedFiles);
    iframe.srcdoc = html;
  }, [debouncedFiles, key]);

  const hasPage = debouncedFiles.some(
    (f) => f.path.endsWith('page.tsx') || f.path.endsWith('page.jsx') || f.path.endsWith('.tsx')
  );

  if (!hasPage) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#05070a] p-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-white/20 mb-3" />
        <p className="text-sm font-black uppercase tracking-[0.2em] text-white/30">Preview Idle</p>
        <p className="mt-2 text-xs text-white/20">Generate a project to view the live preview.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col min-h-0 bg-[#05070a] overflow-hidden flex-1">
      {notice && (
        <div className="flex items-center gap-2 border-b border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 shrink-0">
          <Info className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <span className="truncate">{notice}</span>
        </div>
      )}
      <div className="flex items-center justify-end gap-1 border-b border-white/5 px-3 py-1 shrink-0 bg-[#0a0d14]">
        <button
          onClick={() => setKey((k) => k + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-white/40 hover:bg-white/5 hover:text-white transition"
          title="Refresh Preview"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>
      <div className="flex-1 min-h-[300px] h-full w-full overflow-hidden relative">
        <iframe
          ref={iframeRef}
          key={key}
          title="Live Application Preview"
          className="h-full w-full border-0 bg-[#05070a]"
          style={{ width: '100%', height: '100%', minHeight: '300px' }}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );
}
