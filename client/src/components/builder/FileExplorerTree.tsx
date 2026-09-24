'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronDown, ChevronRight, FileCode2, FileJson, FilePlus,
  FileText, Folder, RefreshCw, Search, Trash2
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

/**
 * Builds a hierarchical tree from flat ProjectFile array, sorting folders first then files alphabetically.
 */
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

  // Sort helper: Folders first, then alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      const aIsFolder = !a.file;
      const bIsFolder = !b.file;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => {
      if (n.children.length > 0) sortNodes(n.children);
    });
  };

  sortNodes(root.children);
  return root.children;
}

function FileIcon({ language }: { language: string }) {
  if (language === 'json') return <FileJson className="h-4 w-4 text-amber-300 shrink-0" />;
  if (language === 'md') return <FileText className="h-4 w-4 text-emerald-400 shrink-0" />;
  if (language === 'sql') return <FileText className="h-4 w-4 text-purple-300 shrink-0" />;
  return <FileCode2 className="h-4 w-4 text-cyan-400 shrink-0" />;
}

function TreeItem({
  node,
  depth = 0,
  activePath,
  dirtyPaths,
  onSelect,
  onDeleteFile,
}: {
  node: TreeNode;
  depth?: number;
  activePath?: string;
  dirtyPaths: Set<string>;
  onSelect: (file: ProjectFile) => void;
  onDeleteFile: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const isFolder = !node.file;

  const indentStyle = { paddingLeft: `${depth * 12 + 12}px` };

  if (isFolder) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={indentStyle}
          className="flex h-8 w-full items-center gap-2 text-left text-xs font-bold text-white/60 hover:bg-white/[0.04] hover:text-white transition-colors"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5 text-white/40 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-white/40 shrink-0" />}
          <Folder className="h-4 w-4 text-cyan-400/80 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>

        {open && (
          <div>
            {node.children.map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
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
  const isActive = activePath === node.file!.path;

  return (
    <div
      style={indentStyle}
      className={cn(
        'group flex h-8 w-full items-center justify-between text-xs transition-all cursor-pointer select-none border-l-2',
        isActive
          ? 'bg-cyan-400/10 border-l-cyan-400 text-cyan-300 font-medium'
          : 'border-l-transparent text-white/50 hover:bg-white/[0.04] hover:text-white'
      )}
      onClick={() => onSelect(node.file!)}
    >
      <div className="flex min-w-0 items-center gap-2">
        <FileIcon language={node.file!.language} />
        <span className="truncate">{node.name}</span>
        {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteFile(node.file!.path);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-opacity mr-2"
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
    <aside className="flex h-full min-h-0 flex-col border-r border-white/[0.06] bg-[#0f131c]">
      {/* Sticky Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-3 bg-[#0f131c] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FaGithub className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="truncate text-xs font-bold uppercase tracking-wider text-white">
            {repoName || 'Project Files'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onSyncRepo}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Sync Repo"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="New File"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 36px Search Input */}
      <div className="p-3 border-b border-white/[0.06] shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/[0.06] bg-[#151a26] pl-9 pr-3 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Inline Create Form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-3 border-b border-white/[0.06] bg-cyan-950/20 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="e.g. src/components/Header.tsx"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              className="h-8 flex-1 rounded-md border border-white/20 bg-black/40 px-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
            <button type="submit" className="h-8 rounded-md bg-cyan-400 px-3 text-xs font-bold text-black hover:bg-cyan-300">
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="h-8 rounded-md border border-white/10 px-2.5 text-xs text-white/50 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Internal Scroll Tree */}
      <div className="min-h-0 flex-1 overflow-y-auto py-2 custom-scrollbar">
        {tree.length === 0 ? (
          <div className="p-4 text-center text-xs text-white/30">
            {searchQuery ? 'No matching files' : 'No project files'}
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
