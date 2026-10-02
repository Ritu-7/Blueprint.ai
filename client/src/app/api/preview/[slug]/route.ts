import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ProjectFile } from '@/types/project';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Builds the full standalone HTML for a given set of project files */
function buildPreviewHTML(files: ProjectFile[], projectName: string): string {
  const pageFile =
    files.find((f) => f.path === 'app/page.tsx' || f.path === 'page.tsx') ??
    files.find((f) => f.path.endsWith('page.tsx') || f.path.endsWith('page.jsx') || f.path.endsWith('.tsx'));

  if (!pageFile) {
    return `<!DOCTYPE html><html><head><title>${projectName} Preview</title></head>
    <body style="background:#05070a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px;">
      <h2 style="margin:0;font-size:18px;font-weight:900;">${projectName}</h2>
      <p style="margin:0;color:#71717a;font-size:13px;">No page.tsx found in this project.</p>
    </body></html>`;
  }

  let code = pageFile.content ?? '';
  code = code.replace(/^\s*['"]use (client|server)['"];?\s*\n?/gm, '');
  code = code.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');

  // Detect component name then strip exports
  let defaultComponentName = 'Page';
  const defaultFnMatch = code.match(/\bexport\s+default\s+function\s+([A-Za-z0-9_]+)/);
  if (defaultFnMatch) defaultComponentName = defaultFnMatch[1];
  code = code.replace(/\bexport\s+default\s+function\b/g, 'function');
  code = code.replace(/\bexport\s+default\s+class\b/g, 'class');
  code = code.replace(/\bexport\s+default\s+/g, 'var __defaultExport = ');
  code = code.replace(/\bexport\s+(function|const|let|var|class)\b/g, '$1');
  code += `\n\nwindow.__PreviewComponent = typeof ${defaultComponentName} !== 'undefined' ? ${defaultComponentName} : (typeof __defaultExport !== 'undefined' ? __defaultExport : null);`;

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
      document.getElementById('root').innerHTML =
        '<div style="padding:24px;color:#f87171;font-family:monospace;background:#05070a;border-radius:12px;margin:16px;border:1px solid #334155;">' +
        '<h4 style="margin:0 0 8px;font-size:13px;font-weight:bold;">Preview Error</h4>' +
        '<pre style="margin:0;font-size:11px;white-space:pre-wrap;">' + (msg || err) + '</pre></div>';
    };
  </script>
  <script>
    const { useState, useEffect, useMemo, useCallback, useRef, useReducer, useContext, createContext } = React;
    const Link = ({ href, children, ...p }) => React.createElement('a', { href: href || '#', ...p }, children);
    const Image = ({ src, alt, width, height, ...p }) => React.createElement('img', { src: src || '', alt: alt || '', width, height, ...p });
    const useRouter = () => ({ push: () => {}, replace: () => {}, back: () => {}, forward: () => {} });
    const usePathname = () => '/';
    const useSearchParams = () => new URLSearchParams();

    const LucideProxy = new Proxy({}, {
      get: (_, prop) => typeof prop !== 'string' ? () => null : function Icon({ className = '', size = 16, style = {}, ...p }) {
        return React.createElement('span', { className: 'inline-flex items-center justify-center ' + className, style: Object.assign({ display:'inline-flex', width: size, height: size }, style), ...p }, '✦');
      }
    });
    const Search = LucideProxy.Search; const Sparkles = LucideProxy.Sparkles; const Plus = LucideProxy.Plus;
    const ArrowUpRight = LucideProxy.ArrowUpRight; const Check = LucideProxy.Check; const Trash2 = LucideProxy.Trash2;
    const Filter = LucideProxy.Filter; const Star = LucideProxy.Star; const Shield = LucideProxy.Shield;
    const Activity = LucideProxy.Activity; const X = LucideProxy.X; const Home = LucideProxy.Home;
    const User = LucideProxy.User; const Settings = LucideProxy.Settings; const Bell = LucideProxy.Bell;
    const Menu = LucideProxy.Menu; const ChevronDown = LucideProxy.ChevronDown; const ChevronRight = LucideProxy.ChevronRight;
    const Edit = LucideProxy.Edit; const Eye = LucideProxy.Eye; const Heart = LucideProxy.Heart;
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
        var rawUserCode = ${JSON.stringify(code)};

        // Use Babel Standalone to transpile TSX to pure JavaScript cleanly
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
                               (typeof Page !== 'undefined' ? Page : null) ||
                               (typeof App !== 'undefined' ? App : null);

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
