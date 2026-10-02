import { logger } from '@/lib/logger/logger';
import type { ProjectFile } from '@/types/project';

export interface SSEEvent {
  type: 'plan_delta' | 'file_start' | 'file_delta' | 'file_end' | 'file_delete' | 'done' | 'error';
  path?: string;
  chunk?: string;
  error?: string;
  files?: ProjectFile[];
}

export type EventCallback = (event: SSEEvent) => void;

const MAX_CONTEXT_CHARS = 14000;

/** Google retires Gemini model names regularly. Env override first, then these; the next one is tried on a 404. */
const GEMINI_DEFAULT_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash'];
const GEMINI_MAX_OUTPUT_TOKENS = 32000;

function geminiCandidates(): string[] {
  const configured = (process.env.GEMINI_CODEGEN_MODEL || '').trim();
  return Array.from(new Set([configured, ...GEMINI_DEFAULT_MODELS].filter(Boolean)));
}

const SYSTEM_PROMPT = `You are a world-class senior frontend engineer. You build complete, production-ready, beautiful React applications based on user prompts.

REQUIREMENTS:
1. Tech Stack: React + TypeScript + Tailwind CSS + Lucide React icons.
2. Architecture: Multi-file Vite/Next-style project structure (e.g., \`src/App.tsx\`, \`src/components/Header.tsx\`, \`src/components/Dashboard.tsx\`, \`src/lib/types.ts\`, \`src/data/mockData.ts\`).
3. Complete Implementation: Build FULL working code. No placeholders, no "TODO", no incomplete handlers, no broken image URLs (use Tailwind colors, gradients, SVG, or emojis instead of external image URLs).
4. Realistic Mock Data: Provide rich, realistic initial state/data so the app immediately looks populated, polished, and vibrant.
5. Interactive Features: Add working state handlers (search, filtering, modals, tabs, forms, create/delete/edit, completion toggles).

OUTPUT FORMAT SPECIFICATION:
First, output a short 1-2 sentence plan explaining what you are building.
Then, output EVERY file inside a <file path="..."> block like this:

<file path="src/App.tsx">
import React from 'react';
// full code...
</file>

If deleting an unnecessary file, output:
<delete path="src/oldFile.ts"/>

CRITICAL: Output FULL file contents inside <file path="...">. Never use truncation or snippets.

PROJECT CONSTRAINTS:
- The entry point MUST be src/App.tsx with a default export. Use relative imports between files.
- Do NOT create index.tsx, main.tsx, index.html, package.json, tsconfig, tailwind config or any .css file. They are provided automatically (Tailwind comes from a CDN, use utility classes).
- Allowed packages ONLY: react, lucide-react, framer-motion, recharts, clsx, tailwind-merge. No next/* imports, no network or backend calls.

EDIT MODE (when current files are provided):
- Output ONLY files that are new or changed, each in FULL. Never output unchanged files.
- Preserve working features. If the user only asks a question, answer in plain text with no file blocks.`;

export class CodegenService {
  /** Returns the active provider info. Gemini is the only supported provider. */
  static getActiveProvider(): { provider: 'gemini' | 'none'; model: string } {
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return { provider: 'gemini', model: geminiCandidates()[0] };
    }
    return { provider: 'none', model: 'none' };
  }

  /** Streams code generation SSE events for a prompt */
  static async streamGenerate(params: {
    prompt: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
    currentFiles?: ProjectFile[];
    onEvent: EventCallback;
  }): Promise<void> {
    const { prompt, history = [], currentFiles = [], onEvent } = params;
    const providerInfo = CodegenService.getActiveProvider();

    logger.info(`Codegen request using provider: ${providerInfo.provider} (${providerInfo.model})`, 'codegenService');

    if (providerInfo.provider === 'none') {
      onEvent({
        type: 'error',
        error: 'AI is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY in .env.local (free key: https://aistudio.google.com/apikey) and restart the server.',
      });
      return;
    }

    await CodegenService.streamGeminiWithFallback({ prompt, history, currentFiles, onEvent });
  }

  /** Tries each candidate Gemini model; moves to the next only on a 404 (retired / unknown model) before any output. */
  private static async streamGeminiWithFallback(params: {
    prompt: string;
    history: { role: 'user' | 'assistant'; content: string }[];
    currentFiles: ProjectFile[];
    onEvent: EventCallback;
  }): Promise<void> {
    const { onEvent, ...rest } = params;
    const models = geminiCandidates();

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const isLast = i === models.length - 1;
      let started = false;
      let notFound = false;

      const guarded: EventCallback = (e) => {
        if (e.type === 'plan_delta' || e.type === 'file_start') started = true;
        if (e.type === 'error' && !started && !isLast && /Gemini API error \(404\)/.test(e.error ?? '')) {
          notFound = true;
          return;
        }
        onEvent(e);
      };

      if (i > 0) logger.warn(`Gemini model "${models[i - 1]}" unavailable - trying "${model}"`, 'codegenService');
      await CodegenService.streamGemini({ ...rest, model, onEvent: guarded });
      if (!notFound) return;
    }
  }

  /** Stream via Gemini API fallback */
  private static async streamGemini(params: {
    prompt: string;
    history: { role: 'user' | 'assistant'; content: string }[];
    currentFiles: ProjectFile[];
    model: string;
    onEvent: EventCallback;
  }): Promise<void> {
    const { prompt, history, currentFiles, model, onEvent } = params;
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';

    let userContent = prompt;
    if (currentFiles.length > 0) {
      const filesSummary = currentFiles
        .map((f) => `<file path="${f.path}">\n${f.content.slice(0, MAX_CONTEXT_CHARS)}\n</file>`)
        .join('\n\n');
      userContent = `Current files:\n${filesSummary}\n\nUser request:\n${prompt}`;
    }

    try {
      const url = `${baseUrl}/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            ...history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
            { role: 'user', parts: [{ text: userContent }] },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
            // Thinking tokens count against maxOutputTokens and slow the stream; keep them minimal for code output.
            ...(/gemini-3/.test(model)
              ? { thinkingConfig: { thinkingLevel: 'low' } }
              : /2\.5-flash/.test(model)
              ? { thinkingConfig: { thinkingBudget: 0 } }
              : {}),
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        const hint =
          res.status === 429
            ? ' Free-tier rate limit reached. Wait about a minute and retry.'
            : res.status === 400 || res.status === 403
            ? ' Check GOOGLE_GENERATIVE_AI_API_KEY and GEMINI_CODEGEN_MODEL.'
            : res.status === 404
            ? ` Model "${model}" was not found. Set GEMINI_CODEGEN_MODEL=gemini-3.8-flash.`
            : '';
        onEvent({ type: 'error', error: `Gemini API error (${res.status}).${hint} ${errText.slice(0, 200)}` });
        return;
      }

      if (!res.body) {
        onEvent({ type: 'error', error: 'No response body received from Gemini stream' });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fileParser = new StreamBlockParser(onEvent);
      let gotText = false;
      let finishReason = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          // Only JSON parsing is guarded; parser errors must propagate to the outer catch.
          let data: any;
          try {
            data = JSON.parse(trimmed.slice(5).trim());
          } catch {
            continue;
          }

          if (data.error) {
            onEvent({ type: 'error', error: `Gemini error: ${data.error.message || 'unknown'}` });
            return;
          }
          if (data.promptFeedback?.blockReason) {
            onEvent({ type: 'error', error: `Gemini blocked the request (${data.promptFeedback.blockReason}). Rephrase your prompt.` });
            return;
          }

          const cand = data.candidates?.[0];
          if (cand?.finishReason) finishReason = cand.finishReason;
          for (const part of cand?.content?.parts ?? []) {
            if (part.thought || typeof part.text !== 'string' || !part.text) continue;
            gotText = true;
            fileParser.parseChunk(part.text);
          }
        }
      }

      if (!gotText) {
        onEvent({ type: 'error', error: `Gemini returned no output${finishReason ? ` (finish reason: ${finishReason})` : ''}. Try again.` });
        return;
      }
      if (finishReason === 'MAX_TOKENS') {
        fileParser.finish(); // reports a cut-off file if one was mid-write
        onEvent({ type: 'error', error: 'Gemini hit its output limit before finishing. Try a smaller request.' });
        return;
      }

      if (fileParser.finish()) onEvent({ type: 'done' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onEvent({ type: 'error', error: `Gemini Stream Error: ${msg}` });
    }
  }
}

/** Streaming state machine that extracts <file path="...">...</file> and <delete path="..."/> blocks */
class StreamBlockParser {
  private buffer = '';
  private currentPath: string | null = null;
  private inPlan = true;
  private onEvent: EventCallback;

  constructor(onEvent: EventCallback) {
    this.onEvent = onEvent;
  }

  parseChunk(chunk: string) {
    this.buffer += chunk;
    this.process();
  }

  private process() {
    while (this.buffer.length > 0) {
      if (this.currentPath === null) {
        // Look for <file path="...">
        const fileMatch = this.buffer.match(/<file\s+path=["']([^"']+)["']\s*>/);
        const deleteMatch = this.buffer.match(/<delete\s+path=["']([^"']+)["']\s*\/>/);

        if (deleteMatch && (!fileMatch || (deleteMatch.index! < fileMatch.index!))) {
          // Emit text before delete block as plan
          const planText = this.buffer.slice(0, deleteMatch.index!);
          if (planText && this.inPlan) {
            this.onEvent({ type: 'plan_delta', chunk: planText });
          }
          this.onEvent({ type: 'file_delete', path: deleteMatch[1] });
          this.buffer = this.buffer.slice(deleteMatch.index! + deleteMatch[0].length);
          continue;
        }

        if (fileMatch) {
          // Emit text before file block as plan
          const planText = this.buffer.slice(0, fileMatch.index!);
          if (planText && this.inPlan) {
            this.onEvent({ type: 'plan_delta', chunk: planText });
          }
          this.inPlan = false;
          const safePath = fileMatch[1].trim().replace(/^\/+/, '');
          if (!safePath || safePath.includes('..')) throw new Error(`AI produced an invalid file path: "${fileMatch[1]}"`);
          this.currentPath = safePath;
          this.onEvent({ type: 'file_start', path: this.currentPath });
          this.buffer = this.buffer.slice(fileMatch.index! + fileMatch[0].length);
          continue;
        }

        // No complete tag yet: emit plan text, but hold back any unclosed '<...' tail so a tag
        // split across chunks (e.g. '<file path="src/comp') is never flushed as plan text.
        if (this.inPlan) {
          const lt = this.buffer.lastIndexOf('<');
          const hold =
            lt !== -1 && this.buffer.length - lt < 300 && !this.buffer.slice(lt).includes('>')
              ? lt
              : this.buffer.length;
          if (hold > 0) {
            this.onEvent({ type: 'plan_delta', chunk: this.buffer.slice(0, hold) });
            this.buffer = this.buffer.slice(hold);
          }
        }
        break;
      } else {
        // We are currently inside a <file path="..."> block. Look for </file>
        const endIdx = this.buffer.indexOf('</file>');
        if (endIdx !== -1) {
          const codeChunk = this.buffer.slice(0, endIdx);
          if (codeChunk) {
            this.onEvent({ type: 'file_delta', path: this.currentPath, chunk: codeChunk });
          }
          this.onEvent({ type: 'file_end', path: this.currentPath });
          this.buffer = this.buffer.slice(endIdx + 7);
          this.currentPath = null;
        } else {
          // Keep trailing 10 chars to avoid splitting </file>
          if (this.buffer.length > 10) {
            const emitLen = this.buffer.length - 10;
            const codeChunk = this.buffer.slice(0, emitLen);
            this.onEvent({ type: 'file_delta', path: this.currentPath, chunk: codeChunk });
            this.buffer = this.buffer.slice(emitLen);
          }
          break;
        }
      }
    }
  }

  /** Returns false (and emits an error) if the output was cut off mid-file. */
  finish(): boolean {
    if (this.currentPath !== null) {
      const p = this.currentPath;
      this.currentPath = null;
      this.buffer = '';
      this.onEvent({
        type: 'error',
        error: `The AI response was cut off while writing "${p}". Please retry or simplify the request.`,
      });
      return false;
    }
    if (this.inPlan && this.buffer) {
      this.onEvent({ type: 'plan_delta', chunk: this.buffer });
    }
    this.buffer = '';
    return true;
  }
}