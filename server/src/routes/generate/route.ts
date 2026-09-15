import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateApp } from '../utils/ai';
import { createClient } from '../utils/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log('[api/generate] request received');

  try {
    const { userId } = await auth();

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prompt = typeof body === 'object' && body !== null && 'prompt' in body
      ? String((body as { prompt?: unknown }).prompt || '').trim()
      : '';

    console.log('[api/generate] payload', { prompt });

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const generated = await generateApp(prompt);
    console.log('[api/generate] generated mock app', {
      name: generated.name,
      previewLength: generated.preview.length,
      uiCodeLength: generated.uiCode.length,
      schemaLength: generated.schema.length,
      apiLength: generated.api.length,
      fileCount: generated.files.length,
    });

    let projectId: string | undefined;

    if (userId) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('projects' as any)
          .insert([
            {
              user_id: userId,
              name: generated.name,
              description: generated.description,
            ui_code: generated.uiCode,
            schema_code: generated.schema,
            api_code: generated.api,
            files: generated.files,
            prompt,
          },
          ])
          .select('id')
          .single();

        if (error) {
          console.error('[api/generate] Supabase save failed', error);
        } else {
          projectId = data?.id;
        }
      } catch (saveError) {
        console.error('[api/generate] Supabase save exception', saveError);
      }
    } else {
      console.log('[api/generate] anonymous generation, skipping project save');
    }

    return NextResponse.json(
      {
        success: true,
        id: projectId,
        name: generated.name,
        description: generated.description,
        kind: generated.kind,
        preview: generated.preview,
        uiCode: generated.uiCode,
        schema: generated.schema,
        api: generated.api,
        files: generated.files,
        project: {
          id: projectId,
          name: generated.name,
          description: generated.description,
          kind: generated.kind,
          preview: generated.preview,
          ui_code: generated.uiCode,
          schema_code: generated.schema,
          api_code: generated.api,
          files: generated.files,
          prompt,
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[api/generate] generation error', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate app' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


