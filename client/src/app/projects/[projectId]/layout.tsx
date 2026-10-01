'use client';

import { useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { ProjectProvider, useProject } from '@/components/workspace/ProjectContext';
import { ProjectSidebar } from '@/components/workspace/ProjectSidebar';
import { ProjectHeader } from '@/components/workspace/ProjectHeader';
import { WorkspaceLoadingState, WorkspaceErrorState } from '@/components/workspace/WorkspaceStates';
import { cn } from '@/utils/utils';

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
          ? 'w-1.5 hover:w-2 hover:bg-cyan-400/40 cursor-col-resize border-x border-white/[0.04] bg-[#05070a]'
          : 'h-1.5 hover:h-2 hover:bg-cyan-400/40 cursor-row-resize border-y border-white/[0.04] bg-[#05070a]',
        className
      )}
    >
      <div
        className={cn(
          'bg-white/20 group-hover:bg-cyan-400 transition-colors duration-150 rounded-full',
          direction === 'horizontal' ? 'w-0.5 h-8 group-hover:h-12' : 'h-0.5 w-8 group-hover:w-12'
        )}
      />
    </PanelResizeHandle>
  );
}

function WorkspaceLayoutInner({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isLoading, error, refreshProject } = useProject();

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#05070a]">
        <WorkspaceLoadingState message="Initializing project workspace..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070a]">
        <WorkspaceErrorState
          title="Project Not Found"
          message={`Unable to load project "${projectId}". It may have been deleted or moved.`}
          onRetry={refreshProject}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#05070a] text-white">
      {/* Desktop Resizable Layout */}
      <div className="hidden md:flex h-full w-full">
        <PanelGroup direction="horizontal" className="h-full w-full">
          <Panel defaultSize={16} minSize={10} maxSize={28}>
            <ProjectSidebar
              projectId={projectId}
              isMobileOpen={false}
            />
          </Panel>
          <CustomResizeHandle direction="horizontal" />
          <Panel defaultSize={84} minSize={60}>
            <div className="flex flex-1 flex-col h-full min-w-0 min-h-0">
              <ProjectHeader
                projectId={projectId}
                onMobileMenuToggle={() => setIsMobileOpen(true)}
              />
              <main className="flex-1 overflow-y-auto min-h-0 bg-[#05070a]">{children}</main>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Mobile Drawer Layout */}
      <div className="flex md:hidden h-full w-full flex-col">
        <ProjectSidebar
          projectId={projectId}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />
        <div className="flex flex-1 flex-col min-w-0 min-h-0">
          <ProjectHeader
            projectId={projectId}
            onMobileMenuToggle={() => setIsMobileOpen(true)}
          />
          <main className="flex-1 overflow-y-auto min-h-0 bg-[#05070a]">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default function ProjectWorkspaceLayout({
  params,
  children,
}: {
  params: { projectId: string };
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider projectId={params.projectId}>
      <WorkspaceLayoutInner projectId={params.projectId}>{children}</WorkspaceLayoutInner>
    </ProjectProvider>
  );
}
