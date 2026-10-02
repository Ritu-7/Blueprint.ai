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
  /** Returns the active provider info based on available keys */
  static getActiveProvider(): { provider: 'anthropic' | 'gemini' | 'none'; model: string } {
    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (anthropicKey) {
      const model = process.env.CODEGEN_MODEL || 'claude-sonnet-5-5';
      return { provider: 'anthropic', model };
    }

    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey) {
      const model = process.env.GEMINI_CODEGEN_MODEL || 'gemini-2.5-flash';
      return { provider: 'gemini', model };
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
        error: 'AI not configured. Please set ANTHROPIC_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in environment variables.',
      });
      return;
    }

    if (providerInfo.provider === 'anthropic') {
      await CodegenService.streamAnthropic({ prompt, history, currentFiles, model: providerInfo.model, onEvent });
    } else {
      await CodegenService.streamGemini({ prompt, history, currentFiles, model: providerInfo.model, onEvent });
    }
  }

  /** Stream via Anthropic Messages API */
  private static async streamAnthropic(params: {
    prompt: string;
    history: { role: 'user' | 'assistant'; content: string }[];
    currentFiles: ProjectFile[];
    model: string;
    onEvent: EventCallback;
  }): Promise<void> {
    const { prompt, history, currentFiles, model, onEvent } = params;
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';

    const messages = [...history];

    let userContent = prompt;
    if (currentFiles.length > 0) {
      const filesSummary = currentFiles
        .map((f) => `<file path="${f.path}">\n${f.content.slice(0, MAX_CONTEXT_CHARS)}\n</file>`)
        .join('\n\n');
      userContent = `Current files:\n${filesSummary}\n\nUser request:\n${prompt}`;
    }

    messages.push({ role: 'user', content: userContent });

    try {
      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 16000,
          system: SYSTEM_PROMPT,
          messages,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        logger.error(`Anthropic streaming error ${res.status}: ${errText}`, 'codegenService');
        onEvent({ type: 'error', error: `Anthropic API error (${res.status}): ${errText.slice(0, 200)}` });
        return;
      }

      if (!res.body) {
        onEvent({ type: 'error', error: 'No response body received from Anthropic streaming endpoint' });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fileParser = new StreamBlockParser(onEvent);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;

          let data: any;
          try {
            data = JSON.parse(dataStr);
          } catch {
            continue; // ignore malformed SSE line
          }
          if (data.type === 'error') {
            onEvent({ type: 'error', error: `Anthropic stream error: ${data.error?.message || 'unknown'}` });
            return;
          }
          if (data.type === 'content_block_delta' && data.delta?.text) {
            fileParser.parseChunk(data.delta.text);
          }
        }
      }

      if (fileParser.finish()) onEvent({ type: 'done' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Anthropic stream error: ${msg}`, 'codegenService');
      onEvent({ type: 'error', error: `Anthropic Stream Error: ${msg}` });
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
          generationConfig: { temperature: 0.4, maxOutputTokens: 16000 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        onEvent({ type: 'error', error: `Gemini API error (${res.status}): ${errText.slice(0, 200)}` });
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

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fileParser.parseChunk(text);
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
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

        // If no file tag yet, emit as plan text
        if (this.inPlan && this.buffer.length > 30) {
          const emitLen = this.buffer.length - 20; // Keep trailing 20 chars in buffer to avoid splitting tags
          const textToEmit = this.buffer.slice(0, emitLen);
          this.onEvent({ type: 'plan_delta', chunk: textToEmit });
          this.buffer = this.buffer.slice(emitLen);
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
