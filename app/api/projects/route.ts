import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const userId = url.searchParams.get('user_id');

    if (id) {
      const project = await Project.findById(id).lean();
      if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ data: { ...project, id: String(project._id) } });
    }

    const filter: Record<string, unknown> = {};
    if (userId) filter.user_id = userId;

    const projects = await Project.find(filter).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({
      data: projects.map((p: any) => ({ ...p, id: String(p._id) })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const project = await Project.create(body);
    return NextResponse.json({ data: { ...project.toObject(), id: String(project._id) } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) throw new Error('ID is required for updates');

    const project = await Project.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: { ...project, id: String(project._id) } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) throw new Error('ID is required for deletion');

    await Project.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
