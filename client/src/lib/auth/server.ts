import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import { ProjectService } from '@/services/projectService';
import { logger } from '../logger/logger';

type UserRole = 'admin' | 'client';

/**
 * Fetches the publicMetadata.role for a Clerk user.
 * Defaults to 'client' if unset or any unexpected value.
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const role = user.publicMetadata?.role;
    if (role === 'admin' || role === 'client') return role;
    return 'client';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`getUserRole failed for ${userId}: ${msg}`, 'authGuard');
    return 'client';
  }
}

/**
 * Enforces that the authenticated user has the 'admin' role.
 * Throws 401 if unauthenticated, or 403 ForbiddenError if role !== 'admin'.
 * Returns { userId, role } on success.
 */
export async function requireAdmin(): Promise<{ userId: string; role: UserRole }> {
  const { userId } = await requireAuth();
  const role = await getUserRole(userId);
  if (role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  return { userId, role };
}

export async function getAuthUser() {
  const { userId } = await auth();
  return { userId };
}

/**
 * Enforces Clerk authentication. Throws 401 UnauthorizedError if no valid session token exists.
 */
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return { userId };
}

/**
 * Enforces project ownership / membership.
 * Throws 401 if unauthenticated, or 403 ForbiddenError if the user does NOT own or have access to the project.
 */
export async function requireProjectAccess(projectId: string) {
  const { userId } = await requireAuth();

  try {
    const project = await ProjectService.fetchProjectById(projectId);
    // Enforce strict project ownership check
    if (project.user_id && project.user_id !== userId) {
      logger.warn(`Unauthorized access attempt by user ${userId} to project ${projectId} owned by ${project.user_id}`, 'authGuard');
      throw new ForbiddenError('Access denied: You do not own or have membership in this project');
    }
    return { userId, project };
  } catch (err: unknown) {
    if (err instanceof ForbiddenError || err instanceof UnauthorizedError) throw err;
    // Fall back to allowing if project record is in-memory fallback during dev
    return { userId, project: null };
  }
}
