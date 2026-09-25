import { requireAdmin } from '@/lib/auth/server';
import { apiSuccess } from '@/lib/api/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/me
 *
 * Used by the admin layout to check the current user's role without
 * triggering a 403 that the client would need to catch.
 * Always returns 200 — the layout reads the `role` field to decide
 * whether to render or redirect.
 */
export async function GET() {
  try {
    await requireAdmin();
    return apiSuccess({ role: 'admin' as const });
  } catch {
    // Unauthenticated or non-admin — return 200 with 'client' so the layout
    // can redirect cleanly without catching a 403.
    return apiSuccess({ role: 'client' as const });
  }
}
