import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ProjectFile } from '@/types/project';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Transforms ES import statements into local variable declarations bound to global proxies */
function transformCodeImports(code: string): string {
  let result = code.replace(/^\s*['"]use (client|server)['"];?\s*\n?/gm, '');

  // 1. Remove "import type ..." statements completely (TypeScript types)
  result = result.replace(/import\s+type\s+[\s\S]*?from\s+['"].*?['"];?/g, '');

  // 2. Transform imports: handles default imports, named imports, and combined (import React, { useState } from 'react')
  result = result.replace(/import\s+(?:([A-Za-z0-9_]+)\s*,?\s*)?(?:\{([^}]+)\})?\s*from\s*['"]([^'"]+)['"];?/g, (_, defaultName, namedStr, mod) => {
    const lines: string[] = [];

    // Handle default import (e.g. import React from 'react')
    if (defaultName && defaultName !== 'React') {
      lines.push(`var ${defaultName} = (typeof ${defaultName} !== 'undefined' ? ${defaultName} : (window.${defaultName} || {}));`);
    }

    // Handle named imports (e.g. { useState, BarChart3 as MyChart })
    if (namedStr) {
      const symbols = namedStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      for (const sym of symbols) {
        const cleanSym = sym.replace(/^type\s+/, '').trim();
        if (!cleanSym) continue;

        const parts = cleanSym.split(/\s+as\s+/);
        const original = parts[0].trim();
        const alias = (parts[1] || parts[0]).trim();

        if (alias === 'React') continue; // Don't re-declare React

        if (mod === 'lucide-react') {
          lines.push(`var ${alias} = LucideProxy.${original};`);
        } else if (mod === 'react') {
          lines.push(`var ${alias} = React.${original};`);
        } else if (mod.includes('recharts')) {
          lines.push(`var ${alias} = RechartsProxy.${original};`);
        } else if (mod.includes('framer-motion')) {
          lines.push(`var ${alias} = MotionProxy.${original};`);
        } else {
          lines.push(`var ${alias} = (typeof ${alias} !== 'undefined' ? ${alias} : (window.${alias} || {}));`);
        }
      }
    }

    return lines.join('\n');
  });

  // 3. Remove any residual star imports: import * as X from 'module';
  result = result.replace(/import\s+\*\s+as\s+([A-Za-z0-9_]+)\s+from\s*['"]([^'"]+)['"];?/g, (_, alias) => {
    return `var ${alias} = {};`;
  });

  return result;
}

/** Builds the full standalone HTML for a given set of project files */
function buildPreviewHTML(files: ProjectFile[], projectName: string): string {
  // 1. Locate main entry file with priority
  const entryFile =
    files.find((f) => f.path === 'src/App.tsx' || f.path === 'App.tsx' || f.path === 'app/page.tsx' || f.path === 'page.tsx') ??
    files.find((f) => f.path.endsWith('App.tsx') || f.path.endsWith('page.tsx')) ??
    files.find((f) => f.content && (f.content.includes('export default function') || f.content.includes('export default')));

  if (!entryFile) {
    return `<!DOCTYPE html><html><head><title>${projectName} Preview</title></head>
    <body style="background:#05070a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px;">
      <h2 style="margin:0;font-size:18px;font-weight:900;">${projectName}</h2>
      <p style="margin:0;color:#71717a;font-size:13px;">No App.tsx or page.tsx found in this project.</p>
    </body></html>`;
  }

  // 2. Separate helper script files (.tsx, .ts, .js, .jsx)
  const helperFiles = files.filter(
    (f) =>
      f !== entryFile &&
      (f.path.endsWith('.tsx') || f.path.endsWith('.ts') || f.path.endsWith('.jsx') || f.path.endsWith('.js'))
  );

  let combinedCode = '';

  // Process and prepend helper files
  for (const hf of helperFiles) {
    let hCode = transformCodeImports(hf.content ?? '');
    hCode = hCode.replace(/\bexport\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'function $1');
    hCode = hCode.replace(/\bexport\s+default\s+/g, 'var __helperDefault = ');
    hCode = hCode.replace(/\bexport\s+(function|const|let|var|class|interface|type)\b/g, '$1');
    combinedCode += `// --- ${hf.path} ---\n${hCode}\n\n`;
  }

  // Process main entry file
  let mainCode = transformCodeImports(entryFile.content ?? '');

  let defaultComponentName = 'App';
  const defaultFnMatch = mainCode.match(/\bexport\s+default\s+function\s+([A-Za-z0-9_]+)/);
  if (defaultFnMatch) defaultComponentName = defaultFnMatch[1];
  mainCode = mainCode.replace(/\bexport\s+default\s+function\b/g, 'function');
  mainCode = mainCode.replace(/\bexport\s+default\s+class\b/g, 'class');
  mainCode = mainCode.replace(/\bexport\s+default\s+/g, 'var __defaultExport = ');
  mainCode = mainCode.replace(/\bexport\s+(function|const|let|var|class)\b/g, '$1');

  combinedCode += `// --- Main Entry: ${entryFile.path} ---\n${mainCode}\n\n`;
  combinedCode += `window.__PreviewComponent = typeof ${defaultComponentName} !== 'undefined' ? ${defaultComponentName} : (typeof App !== 'undefined' ? App : (typeof Page !== 'undefined' ? Page : (typeof __defaultExport !== 'undefined' ? __defaultExport : null)));`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName} — Blueprint.ai Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: { extend: { colors: { accent: '#22d3ee', cyan: { 400: '#22d3ee' } } } }
    };
  </script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script>
    window.exports = {};
    window.module = { exports: window.exports };
    window.onerror = function(msg, url, line, col, err) {
      var root = document.getElementById('root');
      if (root) {
        root.innerHTML =
          '<div style="padding:24px;color:#f87171;font-family:monospace;background:#05070a;border-radius:12px;margin:16px;border:1px solid #334155;">' +
          '<h4 style="margin:0 0 8px;font-size:13px;font-weight:bold;">Preview Error</h4>' +
          '<pre style="margin:0;font-size:11px;white-space:pre-wrap;">' + (msg || err) + '</pre></div>';
      }
    };
  </script>
  <script>
    const { useState, useEffect, useMemo, useCallback, useRef, useReducer, useContext, createContext } = React;
    const Link = ({ href, children, ...p }) => React.createElement('a', { href: href || '#', ...p }, children);
    const Image = ({ src, alt, width, height, ...p }) => React.createElement('img', { src: src || '', alt: alt || '', width, height, ...p });
    const useRouter = () => ({ push: () => {}, replace: () => {}, back: () => {}, forward: () => {} });
    const usePathname = () => '/';
    const useSearchParams = () => new URLSearchParams();

    // Universal proxy for ANY Lucide-React icon component
    const LucideProxy = new Proxy({}, {
      get: (_, prop) => typeof prop !== 'string' ? () => null : function Icon({ className = '', size = 16, style = {}, ...p }) {
        return React.createElement('span', { className: 'inline-flex items-center justify-center ' + className, style: Object.assign({ display:'inline-flex', width: size, height: size }, style), ...p }, '✦');
      }
    });

    // Proxy for Recharts components
    const RechartsProxy = new Proxy({}, {
      get: (_, prop) => typeof prop !== 'string' ? () => null : function RechartsComponent({ children, className = '', ...p }) {
        return React.createElement('div', { className: 'recharts-element ' + className, ...p }, children);
      }
    });

    // Proxy for Framer Motion components
    const MotionProxy = new Proxy({}, {
      get: (_, prop) => typeof prop !== 'string' ? 'div' : new Proxy({}, {
        get: (__, tag) => function MotionComponent({ children, ...p }) {
          return React.createElement(tag || 'div', p, children);
        }
      })
    });
  </script>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #05070a; color: #fff; font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function transpileAndRun() {
      try {
        var rawUserCode = ${JSON.stringify(combinedCode)};

        // Use Babel Standalone to transpile multi-file TSX to pure JavaScript cleanly
        var result = Babel.transform(rawUserCode, {
          presets: ['react', 'typescript'],
          filename: 'page.tsx'
        });

        // Execute transpiled JavaScript
        var scriptEl = document.createElement('script');
        scriptEl.text = result.code;
        document.body.appendChild(scriptEl);

        // Mount React Component
        var ComponentToRender = window.exports.default ||
                               window.__PreviewComponent ||
                               (typeof App !== 'undefined' ? App : null) ||
                               (typeof Page !== 'undefined' ? Page : null);

        if (ComponentToRender) {
          var rootElement = document.getElementById('root');
          var root = ReactDOM.createRoot(rootElement);
          root.render(React.createElement(ComponentToRender));
        } else {
          document.getElementById('root').innerHTML =
            '<div style="padding:24px;color:#f87171;font-family:sans-serif;background:#05070a;">' +
            '<h3 style="margin:0 0 8px;font-size:14px;font-weight:bold;">No Component Exported</h3>' +
            '<p style="margin:0;font-size:12px;color:#94a3b8;">Ensure App.tsx or page.tsx exports a default React component.</p>' +
            '</div>';
        }
      } catch (e) {
        console.error("Transpile/Render Exception:", e);
        document.getElementById('root').innerHTML =
          '<div style="padding:24px;color:#f87171;font-family:monospace;background:#05070a;">' +
          '<h3 style="margin:0 0 8px;font-size:14px;font-weight:bold;">Preview Compilation Error</h3>' +
          '<pre style="margin:0;font-size:12px;white-space:pre-wrap;color:#fca5a5;">' + (e.message || String(e)) + '</pre>' +
          '</div>';
      }
    })();
  </script>
</body>
</html>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

    const supabase = createClient(supabaseUrl, supabaseKey);

    let project: { id: string; name: string; files: unknown } | null = null;

    // 1. UUID lookup (if slug is a project ID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    if (isUuid) {
      const { data } = await supabase.from('projects').select('id, name, files').eq('id', slug).single();
      if (data) project = data;
    }

    // 2. Slug / Name substring lookup
    if (!project) {
      const searchPattern = `%${slug.replace(/-/g, '%')}%`;
      const firstWord = slug.split('-')[0];

      const { data } = await supabase
        .from('projects')
        .select('id, name, files')
        .or(`name.ilike.${searchPattern},name.ilike.%${firstWord}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        project = data[0];
      }
    }

    // 3. Fallback to the most recently updated project
    if (!project) {
      const { data } = await supabase
        .from('projects')
        .select('id, name, files')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        project = data[0];
      }
    }

    if (!project) {
      return new NextResponse(
        `<!DOCTYPE html><html><body style="background:#05070a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px;">
          <h2 style="margin:0;font-size:18px;font-weight:900;">Blueprint.ai Live Preview</h2>
          <p style="color:#71717a;font-size:13px;">Generate a project in the workspace to view its live preview.</p>
          <a href="/" style="color:#22d3ee;font-size:13px;text-decoration:none;border:1px solid #22d3ee40;padding:8px 16px;border-radius:8px;margin-top:8px;">Go to Dashboard</a>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const files: ProjectFile[] = Array.isArray(project.files) ? project.files : [];
    const html = buildPreviewHTML(files, project.name);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#05070a;color:#f87171;font-family:monospace;padding:32px;">
        <h2>Preview Error</h2><pre>${msg}</pre>
      </body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
