import { clerkClient } from '@clerk/nextjs/server';
import { requireAdmin } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { JobStore } from '@/lib/redis/redisJobStore';
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

    // Run all counts in parallel for speed.
    const [clerkUsersResponse, projectsResult, blueprintVersionsResult, queueDepth] =
      await Promise.all([
        clerkClient.users.getCount({}),
        adminClient.from('projects').select('id', { count: 'exact', head: true }),
        adminClient.from('blueprint_versions').select('id', { count: 'exact', head: true }),
        JobStore.queueDepth(),
      ]);

    const totalUsers = clerkUsersResponse;
    const totalProjects = projectsResult.count ?? 0;
    const totalBlueprintVersions = blueprintVersionsResult.count ?? 0;

    return apiSuccess({
      totalUsers,
      totalProjects,
      totalBlueprintVersions,
      queueDepth,
    });
  } catch (err: unknown) {
    return handleApiError(err, 'api/admin/stats');
  }
}
