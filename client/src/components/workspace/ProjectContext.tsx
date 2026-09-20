'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import type { DatabaseProject } from '@/types/database';
import { fetchProjectById, fetchUserProjects } from '@/lib/database';

interface ProjectContextType {
  project: DatabaseProject | null;
  projectsList: DatabaseProject[];
  isLoading: boolean;
  error: string | null;
  refreshProject: () => Promise<void>;
  setProject: React.Dispatch<React.SetStateAction<DatabaseProject | null>>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [project, setProject] = useState<DatabaseProject | null>(null);
  const [projectsList, setProjectsList] = useState<DatabaseProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjectData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjectById(projectId);
      setProject(data as DatabaseProject);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Project not found';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  useEffect(() => {
    async function loadUserProjects() {
      if (user?.id) {
        try {
          const list = await fetchUserProjects(user.id);
          setProjectsList(list as DatabaseProject[]);
        } catch {
          // Fallback empty projects list
        }
      }
    }
    loadUserProjects();
  }, [user]);

  return (
    <ProjectContext.Provider
      value={{
        project,
        projectsList,
        isLoading,
        error,
        refreshProject: loadProjectData,
        setProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
