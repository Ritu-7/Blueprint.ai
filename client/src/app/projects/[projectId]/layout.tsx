'use client';

import { useState } from 'react';
import { ProjectProvider, useProject } from '@/components/workspace/ProjectContext';
import { ProjectSidebar } from '@/components/workspace/ProjectSidebar';
import { ProjectHeader } from '@/components/workspace/ProjectHeader';
import { WorkspaceLoadingState, WorkspaceErrorState } from '@/components/workspace/WorkspaceStates';

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
