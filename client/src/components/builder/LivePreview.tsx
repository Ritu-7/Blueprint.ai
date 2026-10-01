'use client';

import type { ProjectFile } from '@/types/project';
import type { TemplateKind } from '@/lib/templates';
import { BrowserPreview } from './BrowserPreview';
import { BuilderTabs, type BuilderTab } from './BuilderTabs';
import { CodeEditor } from './CodeEditor';
import { GenerationLoader } from './GenerationLoader';
import { ReadmeViewer } from './ReadmeViewer';

export function LivePreview({
  activeTab = 'preview',
  onTabChange,
  kind,
  title,
  projectId,
  files = [],
  activeFile,
  entryFile = 'app/page.tsx',
  onFileSelect,
  schema,
  api,
  readme,
  isLoading,
  error,
}: {
  activeTab?: BuilderTab;
  onTabChange?: (tab: BuilderTab) => void;
  kind?: TemplateKind;
  title?: string;
  projectId?: string;
  files?: ProjectFile[];
  activeFile?: ProjectFile;
  entryFile?: string;
  onFileSelect?: (file: ProjectFile) => void;
  schema?: string;
  api?: string;
  readme?: string;
  isLoading?: boolean;
  error?: string | null;
}) {
  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-none bg-[#070a0f]">
      {onTabChange && <BuilderTabs activeTab={activeTab} onChange={onTabChange} />}
      {error && !isLoading ? (
        <div className="grid flex-1 place-items-center p-8 text-center">
          <div className="max-w-md rounded-2xl border border-rose-400/20 bg-rose-400/10 p-6">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-200">Generation failed</p>
            <p className="mt-3 text-sm text-white/65">{error}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 flex flex-col">
          {activeTab === 'preview' && (
            <BrowserPreview
              kind={kind}
              title={title}
              projectId={projectId}
              files={files}
              activeFile={activeFile}
              entryFile={entryFile}
            />
          )}
          {activeTab === 'code' && <CodeEditor file={activeFile} />}
          {activeTab === 'readme' && <ReadmeViewer content={readme || ''} />}
          {activeTab === 'schema' && <CodeEditor title="supabase/schema.sql" fallbackContent={schema} />}
          {activeTab === 'api' && <CodeEditor title="docs/api.md" fallbackContent={api} />}
        </div>
      )}
      {isLoading && <GenerationLoader />}
    </section>
  );
}
