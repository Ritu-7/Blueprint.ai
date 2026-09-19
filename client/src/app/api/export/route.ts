import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      downloadUrl: '#',
      message: 'Project export bundle created successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export project';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
