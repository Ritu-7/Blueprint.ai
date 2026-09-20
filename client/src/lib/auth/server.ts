import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '../errors/AppError';

export async function getAuthUser() {
  const { userId } = await auth();
  return { userId };
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return { userId };
}
