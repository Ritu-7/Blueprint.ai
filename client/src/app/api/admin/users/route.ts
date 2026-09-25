import { clerkClient } from '@clerk/nextjs/server';
import { requireAdmin } from '@/lib/auth/server';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    // Fetch up to 500 users; for most apps this is more than enough.
    const response = await clerkClient.users.getUserList({ limit: 500 });
    const users = response.data.map((u) => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || null,
      email: u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? null,
      role: (u.publicMetadata as Record<string, unknown>)?.role ?? 'client',
      createdAt: new Date(u.createdAt).toISOString(),
    }));

    return apiSuccess({ users, total: users.length });
  } catch (err: unknown) {
    return handleApiError(err, 'api/admin/users');
  }
}
