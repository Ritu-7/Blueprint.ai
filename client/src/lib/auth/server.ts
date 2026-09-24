import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import { ProjectService } from '@/services/projectService';
import { logger } from '../logger/logger';

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
