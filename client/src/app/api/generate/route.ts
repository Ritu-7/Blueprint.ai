import { NextRequest, NextResponse } from 'next/server';
import { generateProjectFromPrompt } from '@/lib/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const prompt = typeof body === 'object' && body !== null && 'prompt' in body
      ? String((body as { prompt?: unknown }).prompt || '').trim()
      : '';

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const generated = generateProjectFromPrompt(prompt);

    return NextResponse.json({
      success: true,
      ...generated,
      project: {
        ...generated,
        prompt,
        ui_code: generated.uiCode,
        schema_code: generated.schema,
        api_code: generated.api,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate app';
    console.error('[api/generate] generation error', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
