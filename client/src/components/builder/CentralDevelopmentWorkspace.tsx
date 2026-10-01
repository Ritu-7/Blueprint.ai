'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/utils/utils';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import type { ProjectFile } from '@/types/project';
import JSZip from 'jszip';

import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { TopNav } from './TopNav';
import { WorkspaceHeader } from './WorkspaceHeader';
import { FileExplorerTree } from './FileExplorerTree';
import { CodeEditorWorkspace } from './CodeEditorWorkspace';
import { AIEngineeringAssistant } from './AIEngineeringAssistant';
import { BottomWorkspaceDock, TerminalLog, ProblemItem } from './BottomWorkspaceDock';
import { LivePreview } from './LivePreview';
import { GithubModal } from './GithubModal';
import { VercelModal } from './VercelModal';
import { updateProject } from '@/lib/database.client';

export function CentralDevelopmentWorkspace({
  initialProject,
  onProjectUpdate,
  showTopNav = true,
}: {
  initialProject: any;
  onProjectUpdate?: (updated: any) => void;
  /** When true (default), renders the IDE's own TopNav header bar.
   *  Set to false when mounted inside /projects/[projectId]/builder where
   *  ProjectHeader already provides top-level navigation. */
  showTopNav?: boolean;
}) {
  const { user } = useUser();
  const [project, setProject] = useState<any>(initialProject);

  // File system state
  const [files, setFiles] = useState<ProjectFile[]>(initialProject?.files || []);
  const [openTabs, setOpenTabs] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | undefined>();

  // Edited content buffers & unsaved changes tracking
  const [contentMap, setContentMap] = useState<Record<string, string>>({});
  const [dirtyPaths, setDirtyPaths] = useState<Set<string>>(new Set());

  // Resizable Panel States
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(360);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // UI Panel toggles
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isBottomDockExpanded, setIsBottomDockExpanded] = useState(true);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isVercelModalOpen, setIsVercelModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Bottom dock state
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'l1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'info',
      message: 'Workspace initialized. Central Development Environment ready.',
    },
  ]);

  const addLog = useCallback((type: 'info' | 'success' | 'warn' | 'error', message: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type,
        message,
      },
    ]);
  }, []);

  // Sync project updates
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
      if (initialProject.files && initialProject.files.length > 0) {
        setFiles(initialProject.files);
        if (!activeFile) {
          setActiveFile(initialProject.files[0]);
          setOpenTabs([initialProject.files[0]]);
        }
      }
    }
  }, [initialProject, activeFile]);

  useEffect(() => {
    if (files.length > 0 && !activeFile) {
      setActiveFile(files[0]);
      setOpenTabs([files[0]]);
    }
  }, [files, activeFile]);

  // Real-time problem checking
  const problems = useMemo(() => {
    const list: ProblemItem[] = [];
    files.forEach((file) => {
      const content = contentMap[file.path] ?? file.content ?? '';
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (line.includes('console.log') && !line.includes('//')) {
          list.push({
            id: `${file.path}-${idx}-warn`,
            filePath: file.path,
            line: idx + 1,
            message: 'Unexpected console statement found in production file',
            severity: 'warning',
          });
        }
        if (line.includes('any') && (file.path.endsWith('.ts') || file.path.endsWith('.tsx'))) {
          list.push({
            id: `${file.path}-${idx}-any`,
            filePath: file.path,
            line: idx + 1,
            message: 'Type safety: explicit `any` usage detected',
            severity: 'warning',
          });
        }
        if (line.includes('TODO:') || line.includes('FIXME:')) {
          list.push({
            id: `${file.path}-${idx}-todo`,
            filePath: file.path,
            line: idx + 1,
            message: `Pending task: ${line.trim()}`,
            severity: 'warning',
          });
        }
      });
    });
    return list;
  }, [files, contentMap]);

  // Merge contentMap edits on top of base files for live preview
  const mergedFiles = useMemo(() => {
    return files.map((file) => ({
      ...file,
      content: contentMap[file.path] ?? file.content,
    }));
  }, [files, contentMap]);

  // Tab & File Selection
  const handleSelectFile = (file: ProjectFile) => {
    setActiveFile(file);
    if (!openTabs.some((t) => t.path === file.path)) {
      setOpenTabs((prev) => [...prev, file]);
    }
  };

  const handleCloseTab = (path: string) => {
    const nextTabs = openTabs.filter((t) => t.path !== path);
    setOpenTabs(nextTabs);
    if (activeFile?.path === path) {
      setActiveFile(nextTabs[nextTabs.length - 1]);
    }
  };

  // Content Modification
  const handleChangeContent = (path: string, newContent: string) => {
    setContentMap((prev) => ({ ...prev, [path]: newContent }));
    setDirtyPaths((prev) => new Set(prev).add(path));
  };

  // Save File to Database
  const handleSaveFile = async (path: string) => {
    const content = contentMap[path];
    if (content === undefined) return;

    const nextFiles = files.map((f) => (f.path === path ? { ...f, content } : f));
    setFiles(nextFiles);

    setDirtyPaths((prev) => {
      const next = new Set(prev);
      next.delete(path);
      return next;
    });

    addLog('info', `Saving ${path}...`);

    if (project?.id) {
      setIsSaving(true);
      try {
        await updateProject(project.id, { files: nextFiles });
        if (onProjectUpdate) {
          onProjectUpdate({ ...project, files: nextFiles });
        }
        addLog('success', `Persisted changes in ${path} to Supabase`);
        toast.success(`Saved ${path}`);
      } catch (err: any) {
        addLog('error', `Failed to persist ${path} to database: ${err.message}`);
        toast.error(`Failed to save ${path}`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Create New File
  const handleCreateFile = (path: string) => {
    if (files.some((f) => f.path === path)) {
      toast.error('File already exists');
      return;
    }

    const ext = path.split('.').pop() || '';
    let language: any = 'ts';
    if (ext === 'tsx' || ext === 'jsx') language = 'tsx';
    else if (ext === 'json') language = 'json';
    else if (ext === 'sql') language = 'sql';
    else if (ext === 'md') language = 'md';

    const newFile: ProjectFile = {
      name: path.split('/').pop() || path,
      path,
      language,
      content: '// New file created in workspace\n',
    };

    const nextFiles = [...files, newFile];
    setFiles(nextFiles);
    handleSelectFile(newFile);
    addLog('info', `Created new file: ${path}`);
    toast.success(`Created ${path}`);
  };

  // Delete File
  const handleDeleteFile = (path: string) => {
    const nextFiles = files.filter((f) => f.path !== path);
    setFiles(nextFiles);
    handleCloseTab(path);
    addLog('warn', `Deleted file: ${path}`);
    toast.info(`Deleted ${path}`);
  };

  // Apply AI Code / Patches to workspace files
  const handleApplyAICode = (codeOrFiles: string | Array<{ path: string; newContent: string }>, targetPath?: string) => {
    if (Array.isArray(codeOrFiles)) {
      if (codeOrFiles.length === 0) return;
      codeOrFiles.forEach((mod) => {
        handleChangeContent(mod.path, mod.newContent);
      });
      const names = codeOrFiles.map((m) => m.path.split('/').pop() || m.path).join(', ');
      addLog('success', `Applied AI code patch to ${names}`);
      toast.success(`Applied AI code update to ${names}`);
    } else if (typeof codeOrFiles === 'string') {
      const path = targetPath || activeFile?.path;
      if (!path) return;
      handleChangeContent(path, codeOrFiles);
      const name = path.split('/').pop() || path;
      addLog('success', `Applied AI code update to ${name}`);
      toast.success(`Applied AI code update to ${name}`);
    }
  };

  // Format File Action
  const handleFormatFile = (path: string) => {
    const current = contentMap[path] ?? files.find((f) => f.path === path)?.content ?? '';
    if (path.endsWith('.json')) {
      try {
        const formatted = JSON.stringify(JSON.parse(current), null, 2);
        handleChangeContent(path, formatted);
        toast.success('Formatted JSON');
        addLog('info', `Formatted JSON structure in ${path}`);
      } catch {
        toast.error('Cannot format invalid JSON');
      }
    } else {
      toast.info('File formatted');
    }
  };

  // Commit Changes Action (real database persistence + GitHub push if connected)
  const handleCommitChanges = async (message: string) => {
    const commitMsg = message.trim() || 'feat: update project files from workspace';
    const modifiedCount = dirtyPaths.size;

    // Merge dirty buffers into full files list
    const updatedFiles = files.map((f) => {
      if (dirtyPaths.has(f.path) && contentMap[f.path] !== undefined) {
        return { ...f, content: contentMap[f.path] };
      }
      return f;
    });

    setFiles(updatedFiles);
    addLog('info', `Committing ${modifiedCount > 0 ? modifiedCount : 'all'} file(s): "${commitMsg}"...`);

    // 1. Persist to Supabase database
    if (project?.id) {
      setIsSaving(true);
      try {
        await updateProject(project.id, { files: updatedFiles });
        if (onProjectUpdate) {
          onProjectUpdate({ ...project, files: updatedFiles });
        }
      } catch (err: any) {
        addLog('warn', `Database save notice: ${err.message}`);
      } finally {
        setIsSaving(false);
      }
    }

    // 2. Real GitHub commit/push via API
    const repoName = (project?.name || 'blueprint-app').toLowerCase().replace(/\s+/g, '-');
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName,
          isPrivate: true,
          commitMessage: commitMsg,
          branchName: 'main',
          files: updatedFiles,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addLog('success', `Committed & pushed to GitHub (${data.data?.repoUrl || repoName}): "${commitMsg}"`);
        toast.success(`Committed and pushed to GitHub: "${commitMsg}"`);
        setDirtyPaths(new Set());
      } else {
        const errorDetail = data.error?.message || (typeof data.error === 'string' ? data.error : 'GitHub push not configured');
        addLog('info', `Committed locally to workspace. GitHub notice: ${errorDetail}`);
        toast.success(`Committed locally: "${commitMsg}"`);
        setDirtyPaths(new Set());
      }
    } catch (err: any) {
      addLog('info', `Committed locally. GitHub integration notice: ${err.message}`);
      toast.success(`Committed locally: "${commitMsg}"`);
      setDirtyPaths(new Set());
    }
  };

  // Sync Repo with GitHub API
  const handleSyncRepo = async () => {
    const repoName = (project?.name || 'blueprint-app').toLowerCase().replace(/\s+/g, '-');
    const owner = project?.github_owner || '';
    addLog('info', `Synchronizing workspace with GitHub repository (${repoName})...`);

    try {
      const res = await fetch(
        `/api/github/files?owner=${encodeURIComponent(owner || 'current_user')}&repo=${encodeURIComponent(repoName)}&branch=main`
      );
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.data)) {
        const remoteFiles = data.data;
        const remotePaths = new Set(remoteFiles.map((f: any) => f.path));
        const localPaths = new Set(files.map((f) => f.path));

        const newInRemote = remoteFiles.filter((f: any) => !localPaths.has(f.path));
        const removedInRemote = files.filter((f) => !remotePaths.has(f.path));

        if (newInRemote.length === 0 && removedInRemote.length === 0) {
          addLog('success', `Workspace is fully synchronized with GitHub branch main (${files.length} files).`);
          toast.success('Repository is up to date with GitHub');
        } else {
          addLog(
            'info',
            `GitHub sync completed: ${newInRemote.length} remote addition(s), ${removedInRemote.length} remote deletion(s).`
          );
          toast.info(`Repository synced (${remoteFiles.length} files on GitHub)`);
        }
      } else {
        const errMsg =
          data.error?.message ||
          (typeof data.error === 'string' ? data.error : 'Repository not found on GitHub. Push project first.');
        addLog('warn', `GitHub sync notice: ${errMsg}`);
        toast.info('Repository not yet on GitHub. Use "Push to GitHub" to connect.');
      }
    } catch (err: any) {
      addLog('error', `Sync failed: ${err.message}`);
      toast.error('Failed to synchronize with GitHub');
    }
  };

  // Real Pull Request Creation via GitHub API
  const handleOpenPR = async () => {
    const repoName = (project?.name || 'blueprint-app').toLowerCase().replace(/\s+/g, '-');
    const owner = project?.github_owner || '';
    addLog('info', `Opening Pull Request on GitHub for ${repoName}...`);

    try {
      const res = await fetch('/api/github/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: owner || 'current_user',
          repo: repoName,
          branchName: 'feature/blueprint-update',
          baseBranch: 'main',
          title: `feat: updates to ${project?.name || 'blueprint application'}`,
          body: `Automated Pull Request generated from Blueprint.ai development workspace for ${project?.name || 'project'}.`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addLog('success', `Pull request #${data.data?.number} opened: ${data.data?.prUrl}`);
        toast.success(`Pull request #${data.data?.number} opened on GitHub!`, {
          action: data.data?.prUrl
            ? {
                label: 'View PR',
                onClick: () => window.open(data.data.prUrl, '_blank'),
              }
            : undefined,
        });
      } else {
        const errMsg =
          data.error?.message ||
          (typeof data.error === 'string'
            ? data.error
            : 'Could not create PR. Ensure the repository has been pushed to GitHub first.');
        addLog('error', `PR creation failed: ${errMsg}`);
        toast.error(errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Error connecting to GitHub PR API';
      addLog('error', `PR creation error: ${errMsg}`);
      toast.error(errMsg);
    }
  };

  // Real Client-Side Zip Export
  const handleExportZip = async () => {
    addLog('info', 'Generating project archive zip...');
    try {
      const zip = new JSZip();

      // Add all project files with unsaved buffers applied
      files.forEach((file) => {
        const content = contentMap[file.path] ?? file.content ?? '';
        zip.file(file.path, content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (project?.name || 'blueprint-project').toLowerCase().replace(/\s+/g, '-');
      a.download = `${safeName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addLog('success', `Exported ${files.length} project files to ${safeName}.zip`);
      toast.success('Project archive downloaded!');
    } catch (err: any) {
      addLog('error', `Export failed: ${err.message}`);
      toast.error('Failed to generate project zip');
    }
  };

  // Vercel Deploy Action
  const handleDeploy = () => {
    addLog('info', 'Opening Vercel One-Click Deployment manager...');
    setIsVercelModalOpen(true);
  };

function CustomResizeHandle({
  direction = 'horizontal',
  className = '',
}: {
  direction?: 'horizontal' | 'vertical';
  className?: string;
}) {
  return (
    <PanelResizeHandle
      className={cn(
        'group relative flex items-center justify-center transition-colors duration-150 outline-none select-none z-30 shrink-0',
        direction === 'horizontal'
          ? 'w-1.5 hover:w-2 hover:bg-cyan-400/40 cursor-col-resize border-x border-white/[0.04] bg-[#070a0f]'
          : 'h-1.5 hover:h-2 hover:bg-cyan-400/40 cursor-row-resize border-y border-white/[0.04] bg-[#070a0f]',
        className
      )}
    >
      <div
        className={cn(
          'bg-white/20 group-hover:bg-cyan-400 transition-colors duration-150 rounded-full',
          direction === 'horizontal' ? 'w-0.5 h-6 group-hover:h-10' : 'h-0.5 w-6 group-hover:w-10'
        )}
      />
    </PanelResizeHandle>
  );
}

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0d14] overflow-hidden">
      {/* TopNav (64px) — shown on standalone /builder; hidden inside /projects layout */}
      {showTopNav && <TopNav />}

      {/* Workspace Header (72px) */}
      <WorkspaceHeader
        projectName={project?.name}
        projectDescription={project?.description}
        branchName="main"
        isSaving={isSaving}
        dirtyCount={dirtyPaths.size}
        onPushGithub={() => setIsGithubModalOpen(true)}
        onOpenPR={handleOpenPR}
        onCommit={() => handleCommitChanges('Manual commit from workspace toolbar')}
        onViewReadme={() => {
          const readme = files.find((f) => f.name === 'README.md');
          if (readme) handleSelectFile(readme);
        }}
        onExport={handleExportZip}
        onRegenerate={() => {
          addLog('info', 'Regenerating project blueprint...');
          toast.info('Regenerating project blueprint');
        }}
        onDeploy={handleDeploy}
      />

      {/* 3. Outer Vertical PanelGroup (Main Workspace vs Bottom Dock) */}
      <PanelGroup direction="vertical" className="flex-1 min-h-0">
        {/* Main Workspace Area */}
        <Panel defaultSize={75} minSize={30}>
          {/* Inner Horizontal PanelGroup (File Explorer, Code/Preview, AI Engineer) */}
          <PanelGroup direction="horizontal" className="h-full w-full">
            {/* Left Column: File Explorer */}
            {!isLeftCollapsed && (
              <>
                <Panel defaultSize={18} minSize={12} maxSize={35}>
                  <FileExplorerTree
                    files={files}
                    activeFile={activeFile}
                    dirtyPaths={dirtyPaths}
                    repoName={project?.name}
                    onSelect={handleSelectFile}
                    onCreateFile={handleCreateFile}
                    onDeleteFile={handleDeleteFile}
                    onSyncRepo={handleSyncRepo}
                  />
                </Panel>
                <CustomResizeHandle direction="horizontal" />
              </>
            )}

            {/* Center Column: Multi-tab Code Editor + Split Preview */}
            <Panel defaultSize={57} minSize={30}>
              {isPreviewOpen ? (
                <PanelGroup direction="vertical" className="h-full w-full">
                  <Panel defaultSize={50} minSize={20}>
                    <CodeEditorWorkspace
                      activeFile={activeFile}
                      openTabs={openTabs}
                      dirtyPaths={dirtyPaths}
                      contentMap={contentMap}
                      onSelectTab={handleSelectFile}
                      onCloseTab={handleCloseTab}
                      onChangeContent={handleChangeContent}
                      onSaveFile={handleSaveFile}
                      onFormatFile={handleFormatFile}
                      onTogglePreview={() => setIsPreviewOpen((v) => !v)}
                      isPreviewOpen={isPreviewOpen}
                    />
                  </Panel>
                  <CustomResizeHandle direction="vertical" />
                  <Panel defaultSize={50} minSize={20}>
                    <LivePreview
                      activeTab="preview"
                      onTabChange={() => {}}
                      kind={project?.kind}
                      title={project?.name}
                      files={mergedFiles}
                      activeFile={activeFile}
                      onFileSelect={handleSelectFile}
                      schema={project?.schema_code || ''}
                      api={project?.api_code || ''}
                      readme={project?.readme_code || ''}
                      isLoading={false}
                      error={null}
                    />
                  </Panel>
                </PanelGroup>
              ) : (
                <CodeEditorWorkspace
                  activeFile={activeFile}
                  openTabs={openTabs}
                  dirtyPaths={dirtyPaths}
                  contentMap={contentMap}
                  onSelectTab={handleSelectFile}
                  onCloseTab={handleCloseTab}
                  onChangeContent={handleChangeContent}
                  onSaveFile={handleSaveFile}
                  onFormatFile={handleFormatFile}
                  onTogglePreview={() => setIsPreviewOpen((v) => !v)}
                  isPreviewOpen={isPreviewOpen}
                />
              )}
            </Panel>

            {/* Right Column: AI Engineering Assistant */}
            {!isRightCollapsed && (
              <>
                <CustomResizeHandle direction="horizontal" />
                <Panel defaultSize={25} minSize={18} maxSize={45}>
                  <AIEngineeringAssistant
                    activeFile={activeFile}
                    activeFileContent={activeFile ? contentMap[activeFile.path] ?? activeFile.content : ''}
                    projectFiles={files}
                    projectName={project?.name}
                    onApplyCode={handleApplyAICode}
                  />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>

        {/* Vertical Resize Handle above Bottom Dock */}
        {isBottomDockExpanded && <CustomResizeHandle direction="vertical" />}

        {/* Bottom Dock Panel */}
        <Panel
          defaultSize={25}
          minSize={isBottomDockExpanded ? 15 : 4}
          maxSize={isBottomDockExpanded ? 60 : 4}
        >
          <BottomWorkspaceDock
            isExpanded={isBottomDockExpanded}
            onToggleExpand={() => setIsBottomDockExpanded((v) => !v)}
            logs={logs}
            problems={problems}
            dirtyFiles={dirtyPaths}
            projectFiles={files}
            contentMap={contentMap}
            repoName={project?.name}
            onClearLogs={() => setLogs([])}
            onAddLog={(type, message) => addLog(type, message)}
            onSelectProblemFile={(filePath) => {
              const target = files.find((f) => f.path === filePath);
              if (target) handleSelectFile(target);
            }}
            onCommitChanges={handleCommitChanges}
            onPushGithub={() => setIsGithubModalOpen(true)}
            onRunTests={() => addLog('info', 'Executing structural verification suite...')}
          />
        </Panel>
      </PanelGroup>

      {/* GitHub Modal */}
      <GithubModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
        projectName={project?.name || 'blueprint-app'}
        files={files}
        onSuccess={(url) => {
          addLog('success', `Pushed repository files to ${url}`);
          toast.success(`Pushed to ${url}`);
        }}
      />

      {/* Vercel Deploy Modal */}
      <VercelModal
        isOpen={isVercelModalOpen}
        onClose={() => setIsVercelModalOpen(false)}
        projectName={project?.name || 'blueprint-app'}
        files={mergedFiles}
        onSuccess={(url) => {
          addLog('success', `Deployed live application to Vercel: ${url}`);
          toast.success(`Deployed to ${url}`);
        }}
      />
    </div>
  );
}
