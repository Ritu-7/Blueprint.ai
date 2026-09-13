import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema } from 'next/server';
import { connectDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedResources = ['projects', 'tasks', 'team_members', 'support_tickets'];

function getModel(resource: string) {
  if (mongoose.models[resource]) return mongoose.models[resource];

  const schema = new Schema({}, { strict: false, timestamps: true });
  return mongoose.model(resource, schema);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;
  if (!allowedResources.includes(resource)) {
    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  }

  try {
    await connectDB();
    const Model = getModel(resource);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const countOnly = url.searchParams.get('count') === 'true';

    const filter: Record<string, unknown> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (key === 'id' || key === 'count') continue;
      const num = Number(value);
      filter[key] = value === 'true' ? true : value === 'false' ? false : isNaN(num) ? value : num;
    }

    if (id) {
      const doc = await Model.findById(id).lean();
      if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ data: { ...doc, id: String((doc as any)._id) } });
    }

    if (countOnly) {
      const count = await Model.countDocuments(filter);
      return NextResponse.json({ count });
    }

    const docs = await Model.find(filter).lean();
    return NextResponse.json({
      data: docs.map((d: any) => ({ ...d, id: String(d._id) })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;
  if (!allowedResources.includes(resource)) {
    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  }

  try {
    await connectDB();
    const Model = getModel(resource);
    const body = await request.json();
    const doc = await Model.create(body);
    return NextResponse.json({ data: { ...doc.toObject(), id: String(doc._id) } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;
  if (!allowedResources.includes(resource)) {
    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  }

  try {
    await connectDB();
    const Model = getModel(resource);
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) throw new Error('ID is required for updates');

    const doc = await Model.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: { ...doc, id: String((doc as any)._id) } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;
  if (!allowedResources.includes(resource)) {
    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  }

  try {
    await connectDB();
    const Model = getModel(resource);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) throw new Error('ID is required for deletion');

    await Model.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
