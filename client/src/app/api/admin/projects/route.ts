import { requireAdmin } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    const adminClient = createSupabaseAdminClient();
    if (!adminClient) {
      return apiError(
        'Supabase service-role key is not configured',
        503,
        'SERVICE_UNAVAILABLE',
      );
    }

    // Bypass RLS — the service-role client sees all projects across all users.
    const { data: projects, error } = await adminClient
      .from('projects')
      .select('id, name, user_id, kind, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return apiSuccess({ projects: projects ?? [], total: (projects ?? []).length });
  } catch (err: unknown) {
    return handleApiError(err, 'api/admin/projects');
  }
}
