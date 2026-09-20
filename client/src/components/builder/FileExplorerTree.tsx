'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileJson,
  FilePlus,
  FileText,
  Folder,
  FolderPlus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import type { ProjectFile } from '@/types/project';
import { cn } from '@/utils/utils';

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
  dirtyPaths,
  onSelect,
  onDeleteFile,
}: {
  node: TreeNode;
  activePath?: string;
  dirtyPaths: Set<string>;
  onSelect: (file: ProjectFile) => void;
  onDeleteFile: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const isFolder = !node.file;

  if (isFolder) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5 text-white/40" /> : <ChevronRight className="h-3.5 w-3.5 text-white/40" />}
          <Folder className="h-4 w-4 text-cyan-400/80" />
          <span className="truncate">{node.name}</span>
        </button>
        {open && (
          <div className="ml-3 border-l border-white/5 pl-1">
            {node.children.map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                activePath={activePath}
                dirtyPaths={dirtyPaths}
                onSelect={onSelect}
                onDeleteFile={onDeleteFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isDirty = node.file ? dirtyPaths.has(node.file.path) : false;

  return (
    <div
      className={cn(
        'group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition cursor-pointer',
        activePath === node.file!.path
          ? 'bg-cyan-400/10 text-cyan-100 font-medium'
          : 'text-white/50 hover:bg-white/5 hover:text-white'
      )}
      onClick={() => onSelect(node.file!)}
    >
      <div className="flex min-w-0 items-center gap-2">
        <FileIcon file={node.file!} />
        <span className="truncate">{node.name}</span>
        {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteFile(node.file!.path);
        }}
        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition"
        title="Delete file"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function FileExplorerTree({
  files,
  activeFile,
  dirtyPaths,
  repoName,
  onSelect,
  onCreateFile,
  onDeleteFile,
  onSyncRepo,
}: {
  files: ProjectFile[];
  activeFile?: ProjectFile;
  dirtyPaths: Set<string>;
  repoName?: string;
  onSelect: (file: ProjectFile) => void;
  onCreateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onSyncRepo: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(
      (f) => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    onCreateFile(newFilePath.trim());
    setNewFilePath('');
    setIsCreating(false);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-white/10 bg-[#06090e]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5 bg-white/[0.02]">
        <div className="flex items-center gap-2 min-w-0">
          <FaGithub className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="truncate text-xs font-bold uppercase tracking-wider text-white/70">
            {repoName || 'Project Files'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onSyncRepo}
            className="p-1 rounded text-white/40 hover:text-cyan-300 hover:bg-white/5 transition"
            title="Sync with GitHub Repository"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 rounded text-white/40 hover:text-cyan-300 hover:bg-white/5 transition"
            title="New File"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-white/10 bg-cyan-950/20">
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="e.g. src/components/Header.tsx"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              className="flex-1 rounded border border-white/20 bg-black/40 px-2 py-1 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded bg-cyan-500 px-2.5 py-1 text-xs font-bold text-black hover:bg-cyan-400"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded border border-white/10 px-2 py-1 text-xs text-white/40 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tree Content */}
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {tree.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-white/30">
            {searchQuery ? 'No matching files found' : 'No project files'}
          </div>
        ) : (
          tree.map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              activePath={activeFile?.path}
              dirtyPaths={dirtyPaths}
              onSelect={onSelect}
              onDeleteFile={onDeleteFile}
            />
          ))
        )}
      </div>
    </aside>
  );
}
