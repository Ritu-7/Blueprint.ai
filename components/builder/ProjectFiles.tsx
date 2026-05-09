'use client';

import type { ProjectFile } from '@/lib/templates';
import { CodeEditor } from './CodeEditor';
import { FileExplorer } from './FileExplorer';

export function ProjectFiles({
  files,
  activeFile,
  onSelect,
}: {
  files: ProjectFile[];
  activeFile?: ProjectFile;
  onSelect: (file: ProjectFile) => void;
}) {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[260px_1fr]">
      <FileExplorer files={files} activeFile={activeFile} onSelect={onSelect} />
      <CodeEditor file={activeFile} />
    </div>
  );
}
