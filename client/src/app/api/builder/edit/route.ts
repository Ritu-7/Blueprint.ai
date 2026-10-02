import { NextRequest } from 'next/server';
import { CodegenService, SSEEvent } from '@/services/codegenService';
import { requireAuth } from '@/lib/auth/server';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    await requireAuth(); // never expose the AI key to anonymous callers

    const body = await request.json();
    const prompt: unknown = body?.prompt;
    if (!prompt || typeof prompt !== 'string' || prompt.length > 4000) {
      return new Response(JSON.stringify({ error: 'Instruction prompt is required (max 4000 chars)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const history = Array.isArray(body?.history) ? body.history.slice(-10) : [];
    const currentFiles = Array.isArray(body?.currentFiles) ? body.currentFiles.slice(0, 80) : [];

    const editPrompt = `Instruction for editing the existing application:\n"${prompt}"\n\nReturn ONLY the modified or new files wrapped in <file path="...">...</file> blocks, or files to delete as <delete path="..."/>. Do NOT return unchanged files.`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (event: SSEEvent) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch {
            // client disconnected
          }
        };

        try {
          await CodegenService.streamGenerate({ prompt: editPrompt, history, currentFiles, onEvent: sendEvent });
        } catch (err: unknown) {
          sendEvent({ type: 'error', error: err instanceof Error ? err.message : 'Generation failed' });
        } finally {
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: unknown) {
    return handleApiError(err, 'api/builder/edit');
  }
}