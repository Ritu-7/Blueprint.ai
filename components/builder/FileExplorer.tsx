'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileCode2, FileJson, FileText, Folder } from 'lucide-react';
import type { ProjectFile } from '@/lib/templates';
import { cn } from '@/lib/utils';

type TreeNode = {
  name: string;
  path: string;
  children: TreeNode[];
  file?: ProjectFile;
};

function buildTree(files: ProjectFile[]) {
  const root: TreeNode = { name: 'root', path: '', children: [] };

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join('/');
      let node = current.children.find((child) => child.name === part);

      if (!node) {
        node = { name: part, path, children: [] };
        current.children.push(node);
      }

      if (index === parts.length - 1) node.file = file;
      current = node;
    });
  });

  return root.children;
}

function FileIcon({ file }: { file: ProjectFile }) {
  if (file.language === 'json') return <FileJson className="h-4 w-4 text-yellow-300" />;
  if (file.language === 'md') return <FileText className="h-4 w-4 text-amber-400" />;
  if (file.language === 'sql') return <FileText className="h-4 w-4 text-cyan-300" />;
  return <FileCode2 className="h-4 w-4 text-cyan-200" />;
}

function TreeItem({
  node,
  activePath,
  onSelect,
}: {
  node: TreeNode;
  activePath?: string;
  onSelect: (file: ProjectFile) => void;
}) {
  const [open, setOpen] = useState(true);
  const isFolder = !node.file;

  if (isFolder) {
    return (
      <div>
        <button
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold text-white/55 hover:bg-white/5 hover:text-white"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <Folder className="h-4 w-4 text-cyan-300/80" />
          {node.name}
        </button>
        {open && (
          <div className="ml-4 border-l border-white/5 pl-2">
            {node.children.map((child) => (
              <TreeItem key={child.path} node={child} activePath={activePath} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.file!)}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition',
        activePath === node.file!.path ? 'bg-cyan-400/10 text-cyan-100' : 'text-white/45 hover:bg-white/5 hover:text-white'
      )}
    >
      <span className="w-3.5" />
      <FileIcon file={node.file!} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileExplorer({
  files,
  activeFile,
  onSelect,
}: {
  files: ProjectFile[];
  activeFile?: ProjectFile;
  onSelect: (file: ProjectFile) => void;
}) {
  const tree = useMemo(() => buildTree(files), [files]);

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-white/10 bg-white/[0.02]">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/35">Files</p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {tree.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/30">
            Generate an app to inspect files.
          </div>
        ) : (
          tree.map((node) => <TreeItem key={node.path} node={node} activePath={activeFile?.path} onSelect={onSelect} />)
        )}
      </div>
    </aside>
  );
}
