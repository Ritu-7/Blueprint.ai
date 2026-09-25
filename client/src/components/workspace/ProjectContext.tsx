'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser, useSession } from '@clerk/nextjs';
import type { DatabaseProject } from '@/types/database';
import { fetchProjectById, fetchUserProjects } from '@/lib/database.client';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

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
  const { session } = useSession();
  const [project, setProject] = useState<DatabaseProject | null>(null);
  const [projectsList, setProjectsList] = useState<DatabaseProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjectData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClerkSupabaseClient(session);
      const data = await fetchProjectById(projectId, supabase);
      setProject(data as DatabaseProject);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Project not found';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, session]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  useEffect(() => {
    async function loadUserProjects() {
      if (user?.id) {
        try {
          const supabase = createClerkSupabaseClient(session);
          const list = await fetchUserProjects(user.id, supabase);
          setProjectsList(list as DatabaseProject[]);
        } catch {
          // Fallback empty projects list
        }
      }
    }
    loadUserProjects();
  }, [user, session]);

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
