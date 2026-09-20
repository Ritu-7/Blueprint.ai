'use client';

import { useProject } from '@/components/workspace/ProjectContext';
import { CentralDevelopmentWorkspace } from '@/components/builder/CentralDevelopmentWorkspace';

export default function ProjectBuilderSubPage() {
  const { project, setProject } = useProject();

  return (
    <CentralDevelopmentWorkspace
      initialProject={project}
      onProjectUpdate={(updated) => setProject(updated)}
    />
  );
}
