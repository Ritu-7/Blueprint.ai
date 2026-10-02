import type { ProjectFile } from '@/types/project';
import type { SSEEvent } from '@/services/codegenService';

export function languageFor(path: string): ProjectFile['language'] {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx': return 'tsx';
    case 'ts': return 'ts';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'sql': return 'sql';
    case 'js':
    case 'jsx': return 'js';
    default: return 'md';
  }
}

/** Removes ``` fences / leading newline the model sometimes adds inside <file> blocks. */
export function cleanFileContent(code: string): string {
  return (
    code
      .replace(/^\s*```[a-zA-Z]*\r?\n/, '')
      .replace(/\r?\n```\s*$/, '')
      .replace(/^\r?\n/, '')
      .replace(/\s+$/, '') + '\n'
  );
}

export async function readErrorMessage(res: Response): Promise<string> {
  let msg = `Server returned HTTP ${res.status}`;
  try {
    const j = await res.json();
    const m = j?.error?.message ?? j?.error ?? j?.message;
    if (m) msg = typeof m === 'string' ? m : JSON.stringify(m);
  } catch {
    /* body was not JSON */
  }
  return msg;
}

export interface StreamBuilderOptions {
  prompt: string;
  endpoint?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentFiles?: ProjectFile[];
  signal?: AbortSignal;
  onPlan?: (planSoFar: string) => void;
  onFileStart?: (path: string) => void;
  onFileDone?: (file: ProjectFile) => void;
}

export interface StreamBuilderResult {
  files: ProjectFile[];
  changed: ProjectFile[];
  deleted: string[];
  plan: string;
}

/** Consumes the SSE stream from /api/builder/generate. Throws on ANY error; never fakes success. */
export async function streamBuilder(opts: StreamBuilderOptions): Promise<StreamBuilderResult> {
  const res = await fetch(opts.endpoint ?? '/api/builder/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: opts.prompt,
      history: opts.history ?? [],
      currentFiles: opts.currentFiles ?? [],
    }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new Error(await readErrorMessage(res));

  const drafts = new Map<string, string>();
  const changed = new Map<string, ProjectFile>();
  const deleted: string[] = [];
  let plan = '';
  let finished = false;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const line = block.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;

      let ev: SSEEvent;
      try {
        ev = JSON.parse(line.slice(5).trim());
      } catch {
        continue; // malformed line only; real errors are thrown below
      }

      if (ev.type === 'error') throw new Error(ev.error || 'AI generation failed');
      if (ev.type === 'done') finished = true;
      else if (ev.type === 'plan_delta' && ev.chunk) {
        plan += ev.chunk;
        opts.onPlan?.(plan);
      } else if (ev.type === 'file_start' && ev.path) {
        drafts.set(ev.path, '');
        opts.onFileStart?.(ev.path);
      } else if (ev.type === 'file_delta' && ev.path) {
        drafts.set(ev.path, (drafts.get(ev.path) ?? '') + (ev.chunk ?? ''));
      } else if (ev.type === 'file_end' && ev.path) {
        const file: ProjectFile = {
          path: ev.path,
          name: ev.path.split('/').pop() || ev.path,
          language: languageFor(ev.path),
          content: cleanFileContent(drafts.get(ev.path) ?? ''),
        };
        drafts.delete(ev.path);
        changed.set(ev.path, file);
        opts.onFileDone?.(file);
      } else if (ev.type === 'file_delete' && ev.path) {
        deleted.push(ev.path);
      }
    }
  }

  if (!finished) throw new Error('The AI stream ended unexpectedly. Please retry.');

  const merged = new Map<string, ProjectFile>();
  for (const f of opts.currentFiles ?? []) merged.set(f.path, f);
  for (const p of deleted) merged.delete(p);
  for (const [p, f] of Array.from(changed)) merged.set(p, f);

  return {
    files: Array.from(merged.values()),
    changed: Array.from(changed.values()),
    deleted,
    plan: plan.trim(),
  };
}
