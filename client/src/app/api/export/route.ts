import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    return apiSuccess({
      downloadUrl: '#',
      message: 'Project export bundle created successfully',
    });
  } catch (error: unknown) {
    return handleApiError(error, 'api/export');
  }
}
