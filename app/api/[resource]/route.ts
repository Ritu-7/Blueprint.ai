import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { resource: string } }
) {
  const resource = params.resource;
  const supabase = getSupabaseClient();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  try {
    if (id) {
      const { data, error } = await supabase
        .from(resource)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    const { data, error } = await supabase.from(resource).select('*');
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { resource: string } }
) {
  const resource = params.resource;
  const supabase = getSupabaseClient();

  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from(resource)
      .insert(body)
      .select()
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { resource: string } }
) {
  const resource = params.resource;
  const supabase = getSupabaseClient();

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) throw new Error('ID is required for updates');

    const { data, error } = await supabase
      .from(resource)
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { resource: string } }
) {
  const resource = params.resource;
  const supabase = getSupabaseClient();

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) throw new Error('ID is required for deletion');

    const { error } = await supabase
      .from(resource)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
