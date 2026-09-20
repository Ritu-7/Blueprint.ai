import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ValidationError } from '../errors/AppError';

export async function validateRequestBody<T extends z.ZodTypeAny>(schema: T, request: NextRequest): Promise<z.output<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Invalid JSON payload');
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const issueMessages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new ValidationError(`Validation failed: ${issueMessages}`, result.error.flatten().fieldErrors);
  }

  return result.data;
}
