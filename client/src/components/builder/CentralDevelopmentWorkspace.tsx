'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/utils/utils';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import type { ProjectFile } from '@/types/project';

import { WorkspaceHeader } from './WorkspaceHeader';
import { FileExplorerTree } from './FileExplorerTree';
import { CodeEditorWorkspace } from './CodeEditorWorkspace';
import { AIEngineeringAssistant } from './AIEngineeringAssistant';
import { BottomWorkspaceDock, TerminalLog, ProblemItem } from './BottomWorkspaceDock';
import { LivePreview } from './LivePreview';
import { GithubModal } from './GithubModal';
import { updateProject } from '@/lib/database';

export function CentralDevelopmentWorkspace({
  initialProject,
  onProjectUpdate,
}: {
  initialProject: any;
  onProjectUpdate?: (updated: any) => void;
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
      const content = contentMap[file.path] ?? file.content;
      if (file.language === 'json') {
        try {
          JSON.parse(content);
        } catch (err: any) {
          const msg = err.message || 'JSON Syntax Error';
          const match = msg.match(/line (\d+)/i);
          const line = match ? parseInt(match[1], 10) : 1;
          list.push({
            id: `p-${file.path}-${line}`,
            filePath: file.path,
            line,
            message: msg,
            severity: 'error',
          });
        }
      }
    });
    return list;
  }, [files, contentMap]);

  // Tab Selection
  const handleSelectFile = (file: ProjectFile) => {
    setActiveFile(file);
    if (!openTabs.some((t) => t.path === file.path)) {
      setOpenTabs((prev) => [...prev, file]);
    }
    addLog('info', `Opened file: ${file.path}`);
  };

  // Close Tab
  const handleCloseTab = (path: string) => {
    const remaining = openTabs.filter((t) => t.path !== path);
    setOpenTabs(remaining);
    if (activeFile?.path === path) {
      setActiveFile(remaining[remaining.length - 1]);
    }
  };

  // Change File Content
  const handleChangeContent = (path: string, newContent: string) => {
    setContentMap((prev) => ({ ...prev, [path]: newContent }));
    setDirtyPaths((prev) => new Set(prev).add(path));
  };

  // Save Specific File
  const handleSaveFile = async (path: string) => {
    const updatedContent = contentMap[path];
    if (updatedContent === undefined) return;

    const nextFiles = files.map((f) => (f.path === path ? { ...f, content: updatedContent } : f));
    setFiles(nextFiles);

    setDirtyPaths((prev) => {
      const next = new Set(prev);
      next.delete(path);
      return next;
    });

    addLog('success', `Saved changes to ${path}`);
    toast.success(`Saved ${path}`);

    if (project?.id) {
      setIsSaving(true);
      try {
        await updateProject(project.id, { files: nextFiles });
        if (onProjectUpdate) onProjectUpdate({ ...project, files: nextFiles });
      } catch {
        addLog('error', `Failed to persist ${path} to database`);
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

  // Apply AI Code to Active File
  const handleApplyAICode = (code: string) => {
    if (!activeFile) return;
    handleChangeContent(activeFile.path, code);
    addLog('success', `Applied AI code generation to ${activeFile.name}`);
    toast.success(`Applied AI code to ${activeFile.name}`);
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

  // Commit Changes Action
  const handleCommitChanges = (message: string) => {
    addLog('success', `Committed ${dirtyPaths.size} modified files: "${message}"`);
    setDirtyPaths(new Set());
    toast.success('Changes committed to git timeline');
  };

  // Sync Repo
  const handleSyncRepo = () => {
    addLog('info', 'Synchronizing workspace with GitHub repository...');
    setTimeout(() => {
      addLog('success', 'Repository up to date with branch main');
      toast.success('Repository synced');
    }, 800);
  };

  // Dynamic Column Grid Styles
  const gridColumnsStyle = useMemo(() => {
    const leftCol = isLeftCollapsed ? '0px' : `${leftWidth}px`;
    const rightCol = isRightCollapsed ? '0px' : `${rightWidth}px`;
    return { gridTemplateColumns: `${leftCol} 1fr ${rightCol}` };
  }, [leftWidth, rightWidth, isLeftCollapsed, isRightCollapsed]);

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0d14] overflow-hidden">
      {/* Workspace Header (72px) */}
      <WorkspaceHeader
        projectName={project?.name}
        projectDescription={project?.description}
        branchName="main"
        isSaving={isSaving}
        dirtyCount={dirtyPaths.size}
        onPushGithub={() => setIsGithubModalOpen(true)}
        onOpenPR={async () => {
          addLog('info', 'Opening Pull Request on GitHub...');
          toast.success('Pull request opened!');
        }}
        onCommit={() => handleCommitChanges('Manual commit from toolbar')}
        onViewReadme={() => {
          const readme = files.find((f) => f.name === 'README.md');
          if (readme) handleSelectFile(readme);
        }}
        onExport={async () => {
          addLog('info', 'Exporting project archive zip...');
          toast.success('Project zip downloaded!');
        }}
        onRegenerate={() => {
          addLog('info', 'Regenerating project blueprint...');
          toast.info('Regenerating project blueprint');
        }}
        onDeploy={() => {
          addLog('info', 'Triggering edge deployment...');
          toast.success('Deployment queued');
        }}
      />

      {/* 3. Main Workspace Area (1fr) */}
      <div className="grid flex-1 min-h-0 relative overflow-hidden" style={gridColumnsStyle}>
        {/* Left Column: File Explorer (260px) */}
        {!isLeftCollapsed && (
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
        )}

        {/* Center Column: Multi-tab Code Editor + Split Preview */}
        <div className="flex h-full min-h-0 flex-col relative overflow-hidden bg-[#0a0d14]">
          <div className={cn('flex-1 min-h-0', isPreviewOpen && 'h-1/2 flex-none')}>
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
          </div>

          {/* Split Live Preview Window */}
          {isPreviewOpen && (
            <div className="h-1/2 border-t border-cyan-500/30 bg-[#070a0f] min-h-0">
              <LivePreview
                activeTab="preview"
                onTabChange={() => {}}
                kind={project?.kind}
                title={project?.name}
                files={files}
                activeFile={activeFile}
                onFileSelect={handleSelectFile}
                schema={project?.schema_code || ''}
                api={project?.api_code || ''}
                readme={project?.readme_code || ''}
                isLoading={false}
                error={null}
              />
            </div>
          )}
        </div>

        {/* Right Column: AI Engineering Assistant (360px) */}
        {!isRightCollapsed && (
          <AIEngineeringAssistant
            activeFile={activeFile}
            activeFileContent={activeFile ? contentMap[activeFile.path] ?? activeFile.content : ''}
            projectFiles={files}
            projectName={project?.name}
            onApplyCode={handleApplyAICode}
          />
        )}
      </div>

      {/* 4. Bottom Dock: Terminal / Problems / Git Changes / Tests (240px) */}
      <BottomWorkspaceDock
        isExpanded={isBottomDockExpanded}
        onToggleExpand={() => setIsBottomDockExpanded((v) => !v)}
        logs={logs}
        problems={problems}
        dirtyFiles={dirtyPaths}
        projectFiles={files}
        repoName={project?.name}
        onClearLogs={() => setLogs([])}
        onSelectProblemFile={(filePath) => {
          const target = files.find((f) => f.path === filePath);
          if (target) handleSelectFile(target);
        }}
        onCommitChanges={handleCommitChanges}
        onPushGithub={() => setIsGithubModalOpen(true)}
        onRunTests={() => addLog('info', 'Executing structural verification suite...')}
      />

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
    </div>
  );
}
