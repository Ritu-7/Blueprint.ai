'use client';

import { CentralDevelopmentWorkspace } from '@/components/builder/CentralDevelopmentWorkspace';

export default function StandaloneBuilderPage() {
  const dummyProject = {
    name: 'Blueprint Project Workspace',
    description: 'Central AI development workspace with integrated repository, multi-tab code editor, and AI assistant.',
    kind: 'dashboard',
    files: [
      {
        name: 'README.md',
        path: 'README.md',
        language: 'md',
        content: '# Blueprint Project Workspace\n\nWelcome to your central AI development environment.\n\n- Left: Project Explorer & GitHub sync\n- Center: Multi-tab Code Editor with real-time error checking\n- Right: AI Engineering Assistant\n- Bottom: Terminal logs, Problems, Git Changes, and Tests\n',
      },
      {
        name: 'App.tsx',
        path: 'src/App.tsx',
        language: 'tsx',
        content: 'import React from "react";\n\nexport default function App() {\n  return (\n    <div className="p-8 text-white bg-slate-900 min-h-screen">\n      <h1 className="text-2xl font-bold">Blueprint AI Application</h1>\n      <p className="mt-2 text-slate-400">Built with Blueprint Central Workspace.</p>\n    </div>\n  );\n}\n',
      },
      {
        name: 'schema.sql',
        path: 'supabase/schema.sql',
        language: 'sql',
        content: '-- Blueprint PostgreSQL Schema\nCREATE TABLE users (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  email TEXT UNIQUE NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT now()\n);\n',
      },
      {
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: '{\n  "name": "blueprint-app",\n  "version": "1.0.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build"\n  }\n}\n',
      },
    ],
  };

  return <CentralDevelopmentWorkspace initialProject={dummyProject} />;
}
