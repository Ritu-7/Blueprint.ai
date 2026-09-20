'use client';

import { useState, useEffect } from 'react';
import { Bot, Save, Sparkles } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import type { ProjectFile } from '@/types/project';
import { useProject } from '@/components/workspace/ProjectContext';
import { FileExplorer } from '@/components/builder/FileExplorer';
import { LivePreview } from '@/components/builder/LivePreview';
import { PromptBox } from '@/components/builder/PromptBox';
import type { BuilderTab } from '@/components/builder/BuilderTabs';
import { GithubActions } from '@/components/builder/GithubActions';
import { GithubModal } from '@/components/builder/GithubModal';
import { generateReadme } from '@/components/builder/ReadmeViewer';
import { saveProject, updateProject } from '@/lib/database';

export default function ProjectBuilderSubPage() {
  const { user } = useUser();
  const { project, setProject } = useProject();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<BuilderTab>('preview');
  const [activeFile, setActiveFile] = useState<ProjectFile | undefined>();
  const [history, setHistory] = useState<{ prompt: string; date: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);

  useEffect(() => {
    if (project?.files && project.files.length > 0 && !activeFile) {
      setActiveFile(project.files[0]);
    }
  }, [project, activeFile]);

  // Auto-save effect
  useEffect(() => {
    if (!project || !user || isSaving) return;

    const performAutoSave = async () => {
      setIsSaving(true);
      try {
        if (project.id) {
          await updateProject(project.id, {
            name: project.name,
            description: project.description,
            ui_code: project.ui_code,
            schema_code: project.schema_code,
            api_code: project.api_code,
            readme_code: project.readme_code,
            files: project.files,
            kind: project.kind,
          });
        }
      } catch (err) {
        console.error('[builder] auto-save failed', err);
      } finally {
        setIsSaving(false);
      }
    };

    const timer = setTimeout(performAutoSave, 2000);
    return () => clearTimeout(timer);
  }, [project, user, isSaving]);

  const handleGenerate = async (prompt: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const res = await response.json();
      const data = res.data || res;

      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Failed to generate project');
      }

      const readmeContent = generateReadme(data.name, data.description, data.kind);
      const readmeFile: ProjectFile = {
        name: 'README.md',
        path: 'README.md',
        content: readmeContent,
        language: 'md',
      };

      const updatedFiles = [readmeFile, ...(data.files || [])];

      if (project?.id) {
        const updated = await updateProject(project.id, {
          name: data.name,
          description: data.description,
          prompt,
          kind: data.kind,
          ui_code: data.uiCode,
          schema_code: data.schema,
          api_code: data.api,
          readme_code: readmeContent,
          files: updatedFiles,
        });

        setProject(updated as any);
      }

      setActiveFile(updatedFiles[0]);
      setActiveTab('preview');
      setHistory((items) => [{ prompt, date: new Date().toLocaleTimeString() }, ...items.slice(0, 7)]);
      toast.success('Blueprint generated successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#05070a]">
      <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[360px_260px_1fr]">
        <aside className="min-h-0 border-r border-white/10 bg-black/20">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-[#05070a] shadow-[0_0_24px_rgba(0,243,255,0.28)]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-black uppercase tracking-[0.18em] text-white">Blueprint IDE</h1>
                <p className="text-xs text-white/35">AI website builder workspace</p>
              </div>
            </div>
          </div>
          <PromptBox onGenerate={handleGenerate} isLoading={isLoading} history={history} />
        </aside>

        <div className="hidden min-h-0 lg:block">
          <FileExplorer
            files={project?.files || []}
            activeFile={activeFile}
            onSelect={(file) => {
              setActiveFile(file);
              setActiveTab(file.name === 'README.md' ? 'readme' : 'code');
            }}
          />
        </div>

        <main className="min-h-0">
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3">
              <div className="min-w-0 flex items-center gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-white">{project?.name || 'Blueprint Workspace'}</p>
                    {project && <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />}
                  </div>
                  <p className="truncate text-xs text-white/35">{project?.description || 'Generate a prompt to update this blueprint.'}</p>
                </div>
                {project && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
                    {isSaving ? (
                      <>
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3 text-green-400" />
                        Saved
                      </>
                    )}
                  </div>
                )}
              </div>

              <GithubActions
                onPush={() => setIsGithubModalOpen(true)}
                onPR={async () => {
                  toast.promise(fetch('/api/github/pr', { method: 'POST' }), {
                    loading: 'Opening Pull Request...',
                    success: 'Pull request created!',
                    error: 'Failed to create PR',
                  });
                }}
                onExport={async () => {
                  toast.promise(fetch('/api/export', { method: 'POST' }), {
                    loading: 'Preparing ZIP export...',
                    success: 'Download ready!',
                    error: 'Export failed',
                  });
                }}
                onCommit={() => toast.success('Changes committed')}
                onDeploy={() => toast.success('Deployment queued')}
                onRegenerate={() => handleGenerate(project?.prompt || '')}
                onViewReadme={() => setActiveTab('readme')}
                isGenerating={isLoading}
              />
            </div>

            <div className="min-h-0 flex-1">
              <LivePreview
                activeTab={activeTab}
                onTabChange={setActiveTab}
                kind={project?.kind as any}
                title={project?.name}
                files={project?.files || []}
                activeFile={activeFile}
                onFileSelect={setActiveFile}
                schema={project?.schema_code || ''}
                api={project?.api_code || ''}
                readme={project?.readme_code || ''}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </main>
      </div>

      <GithubModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
        projectName={project?.name || ''}
        files={project?.files || []}
        onSuccess={(url) => toast.success(`Pushed to ${url}`)}
      />
    </div>
  );
}
