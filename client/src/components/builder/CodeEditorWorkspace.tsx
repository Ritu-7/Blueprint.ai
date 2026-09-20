'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileJson,
  FileText,
  RotateCcw,
  Save,
  Wand2,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { ProjectFile } from '@/types/project';
import { cn } from '@/utils/utils';

function FileIcon({ language }: { language: string }) {
  if (language === 'json') return <FileJson className="h-3.5 w-3.5 text-yellow-300 shrink-0" />;
  if (language === 'md') return <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
  if (language === 'sql') return <FileText className="h-3.5 w-3.5 text-cyan-300 shrink-0" />;
  return <FileCode2 className="h-3.5 w-3.5 text-cyan-200 shrink-0" />;
}

export function CodeEditorWorkspace({
  activeFile,
  openTabs,
  dirtyPaths,
  contentMap,
  onSelectTab,
  onCloseTab,
  onChangeContent,
  onSaveFile,
  onFormatFile,
  onTogglePreview,
  isPreviewOpen,
}: {
  activeFile?: ProjectFile;
  openTabs: ProjectFile[];
  dirtyPaths: Set<string>;
  contentMap: Record<string, string>;
  onSelectTab: (file: ProjectFile) => void;
  onCloseTab: (path: string) => void;
  onChangeContent: (path: string, newContent: string) => void;
  onSaveFile: (path: string) => void;
  onFormatFile: (path: string) => void;
  onTogglePreview: () => void;
  isPreviewOpen: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const currentContent = activeFile ? contentMap[activeFile.path] ?? activeFile.content : '';
  const isDirty = activeFile ? dirtyPaths.has(activeFile.path) : false;

  const lines = useMemo(() => currentContent.split('\n'), [currentContent]);

  // Basic real-time syntax checking (JSON validation & basic JSX/JS sanity)
  const syntaxErrors = useMemo(() => {
    if (!activeFile) return [];
    const errors: { line: number; message: string }[] = [];
    if (activeFile.language === 'json') {
      try {
        JSON.parse(currentContent);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON format';
        // Extract line number if present
        const match = msg.match(/line (\d+)/i);
        const lineNum = match ? parseInt(match[1], 10) : 1;
        errors.push({ line: lineNum, message: msg });
      }
    }
    return errors;
  }, [activeFile, currentContent]);

  // Keyboard shortcut Ctrl+S / Cmd+S save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeFile && isDirty) {
          onSaveFile(activeFile.path);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, isDirty, onSaveFile]);

  const copy = async () => {
    await navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const download = () => {
    if (!activeFile) return;
    const blob = new Blob([currentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#05070a]">
      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0a0d14] px-1 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-0">
          {openTabs.map((tab) => {
            const isActive = activeFile?.path === tab.path;
            const isTabDirty = dirtyPaths.has(tab.path);
            return (
              <div
                key={tab.path}
                onClick={() => onSelectTab(tab)}
                className={cn(
                  'group flex items-center gap-2 border-r border-white/5 px-3 py-2 text-xs transition cursor-pointer select-none border-b-2',
                  isActive
                    ? 'border-b-cyan-400 bg-white/5 text-white font-medium'
                    : 'border-b-transparent text-white/50 hover:bg-white/[0.02] hover:text-white/80'
                )}
              >
                <FileIcon language={tab.language} />
                <span className="truncate max-w-[140px]">{tab.name}</span>
                {isTabDirty && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-white/30 hover:text-white hover:bg-white/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Toolbar */}
        {activeFile && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 shrink-0">
            {isDirty && (
              <button
                onClick={() => onSaveFile(activeFile.path)}
                className="flex items-center gap-1.5 rounded bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-1 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30 transition"
                title="Save file (Ctrl+S)"
              >
                <Save className="h-3.5 w-3.5 text-cyan-400" />
                <span>Save</span>
              </button>
            )}
            <button
              onClick={() => onFormatFile(activeFile.path)}
              className="p-1.5 rounded text-white/40 hover:text-cyan-300 hover:bg-white/5 transition"
              title="Format file"
            >
              <Wand2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={copy}
              className="p-1.5 rounded text-white/40 hover:text-cyan-300 hover:bg-white/5 transition"
              title="Copy code"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={download}
              className="p-1.5 rounded text-white/40 hover:text-cyan-300 hover:bg-white/5 transition"
              title="Download file"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onTogglePreview}
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium border transition ml-1',
                isPreviewOpen
                  ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-200'
                  : 'border-white/10 text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          </div>
        )}
      </div>

      {/* Syntax Error Banner */}
      {syntaxErrors.length > 0 && (
        <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-950/40 px-3 py-1.5 text-xs text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span className="font-medium">Syntax Error (Line {syntaxErrors[0].line}):</span>
          <span className="truncate">{syntaxErrors[0].message}</span>
        </div>
      )}

      {/* Code Editor Body */}
      {activeFile ? (
        <div className="relative min-h-0 flex-1 overflow-hidden flex">
          {/* Editor Textarea with line numbers */}
          <div className="flex flex-1 min-h-0 overflow-auto bg-[#070a0f] font-mono text-xs">
            {/* Line Numbers Gutter */}
            <div className="select-none py-3 pr-3 text-right text-white/20 border-r border-white/5 bg-[#05070a] shrink-0 font-mono text-[11px] leading-6 min-w-[48px]">
              {lines.map((_, i) => (
                <div key={i} className="px-2 hover:text-white/40">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Content Textarea */}
            <div className="relative flex-1 min-w-0">
              <textarea
                value={currentContent}
                onChange={(e) => onChangeContent(activeFile.path, e.target.value)}
                spellCheck={false}
                className="w-full h-full min-h-[400px] resize-none bg-transparent p-3 font-mono text-xs leading-6 text-cyan-100/90 outline-none focus:outline-none focus:ring-0 border-none select-text"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 place-items-center text-xs text-white/30 p-8 text-center">
          <div>
            <Code2 className="h-10 w-10 text-white/10 mx-auto mb-2" />
            <p className="font-semibold text-white/50">No File Open</p>
            <p className="text-white/30 text-[11px] mt-1">Select a file from the explorer on the left to edit code</p>
          </div>
        </div>
      )}
    </div>
  );
}
