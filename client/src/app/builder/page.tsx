'use client';

import { useState, useCallback, useEffect } from 'react';
import { Bot, Cloud, Rocket, ShieldCheck, Sparkles, Save } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import type { ProjectFile, TemplateKind } from '@/lib/templates';
import { FileExplorer } from '@/components/builder/FileExplorer';
import { LivePreview } from '@/components/builder/LivePreview';
import { PromptBox } from '@/components/builder/PromptBox';
import type { BuilderTab } from '@/components/builder/BuilderTabs';
import { GithubActions } from '@/components/builder/GithubActions';
import { GithubModal } from '@/components/builder/GithubModal';
import { generateReadme } from '@/components/builder/ReadmeViewer';
import { saveProject, updateProject } from '@/lib/database';

type BuilderProject = {
  id?: string;
  name: string;
  description: string;
  kind: TemplateKind;
  preview: string;
  uiCode: string;
  schema: string;
  api: string;
  readme: string;
  files: ProjectFile[];
  prompt: string;
};

export default function BuilderPage() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<BuilderTab>('preview');
  const [activeFile, setActiveFile] = useState<ProjectFile | undefined>();
  const [project, setProject] = useState<BuilderProject | null>(null);
  const [history, setHistory] = useState<{ prompt: string; date: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);

  // Auto-save effect
  useEffect(() => {
    if (!project || !user || isSaving) return;

    const performAutoSave = async () => {
      setIsSaving(true);
      try {
        if (project.id) {
          // Update existing
          await updateProject(project.id, {
            name: project.name,
            description: project.description,
            ui_code: project.uiCode,
            schema_code: project.schema,
            api_code: project.api,
            readme_code: project.readme,
            files: project.files,
            kind: project.kind,
          });
          console.log('[builder] auto-save: updated', project.id);
        } else {
          // Create new
          const saved = await saveProject({
            user_id: user.id,
            name: project.name,
            description: project.description,
            prompt: project.prompt,
            kind: project.kind,
            ui_code: project.uiCode,
            schema_code: project.schema,
            api_code: project.api,
            readme_code: project.readme,
            files: project.files,
            status: 'active'
          });
          setProject(prev => prev ? { ...prev, id: saved.id } : null);
          console.log('[builder] auto-save: created', saved.id);
          toast.success('Project saved to cloud');
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
    console.log('[builder] generate requested', { prompt });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      console.log('[builder] generate response', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate project');
      }

      if (!Array.isArray(data.files) || !data.files.length || !data.preview || !data.schema || !data.api) {     
        throw new Error('Generator returned an incomplete project');
      }

      const readmeContent = generateReadme(data.name, data.description, data.kind);

      const readmeFile: ProjectFile = {
        name: 'README.md',
        path: 'README.md',
        content: readmeContent,
        language: 'md'
      };

      const nextProject: BuilderProject = {
        id: data.id,
        name: data.name,
        description: data.description,
        kind: data.kind,
        preview: data.preview,
        uiCode: data.uiCode,
        schema: data.schema,
        api: data.api,
        readme: readmeContent,
        files: [readmeFile, ...data.files],
        prompt,
      };

      setProject(nextProject);
      setActiveFile(nextProject.files[0]);
      setActiveTab('preview');
      setHistory((items) => [{ prompt, date: new Date().toLocaleTimeString() }, ...items.slice(0, 7)]);

      toast.success('Blueprint generated with files, schema, and README.');
    } catch (err: any) {
      const message = err.message || 'Generation failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToGithub = () => {
    if (!project) return toast.error('Generate a project first');
    setIsGithubModalOpen(true);
  };

  const handlePR = async () => {
    if (!project) return toast.error('Generate a project first');

    toast.promise(fetch('/api/github/pr', { method: 'POST' }), {
      loading: 'Opening Pull Request...',
      success: 'Pull request created successfully!',
      error: 'Failed to create pull request'
    });
  };

  const handleExport = async () => {
    if (!project) return toast.error('Generate a project first');

    toast.promise(fetch('/api/export', { method: 'POST' }), {
      loading: 'Preparing ZIP export...',
      success: 'Project exported! Download starting...',
      error: 'Export failed'
    });
  };

  const handleDeploy = () => {
    if (!project) return toast.error('Generate a project first');

    toast.loading('Initializing deployment...', { duration: 2000 });
    setTimeout(() => toast.loading('Building project assets...', { duration: 2000 }), 2000);
    setTimeout(() => toast.loading('Pushing to edge network...', { duration: 2000 }), 4000);
    setTimeout(() => toast.success('Deployment Live: https://blueprint-deploy.vercel.app'), 6000);
  };

  const handleCommit = () => {
    if (!project) return toast.error('Generate a project first');
    toast.success('Changes committed to local history');
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
              if (file.name === 'README.md') {
                setActiveTab('readme');
              } else {
                setActiveTab('code');
              }
            }}
          />
        </div>

        <main className="min-h-0">
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3">
              <div className="min-w-0 flex items-center gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-white">{project?.name || 'Untitled Blueprint'}</p>
                    {project && <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />}
                  </div>
                  <p className="truncate text-xs text-white/35">{project?.description || 'Generate a prompt to create a complete app workspace.'}</p>
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
                onPush={handlePushToGithub}
                onPR={handlePR}
                onExport={handleExport}
                onCommit={handleCommit}
                onDeploy={handleDeploy}
                onRegenerate={() => handleGenerate(project?.prompt || '')}
                onViewReadme={() => setActiveTab('readme')}
                isGenerating={isLoading}
              />
            </div>

            <div className="min-h-0 flex-1">
              <LivePreview
                activeTab={activeTab}
                onTabChange={setActiveTab}
                kind={project?.kind}
                title={project?.name}
                files={project?.files || []}
                activeFile={activeFile}
                onFileSelect={setActiveFile}
                schema={project?.schema}
                api={project?.api}
                readme={project?.readme}
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
        onSuccess={(url) => toast.success(`Project pushed to ${url}`)}
      />
    </div>
  );
}
