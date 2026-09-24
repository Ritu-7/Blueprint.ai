import { NextRequest } from 'next/server';
import { TaskService } from '@/services/taskService';
import { createTaskSchema, updateTaskSchema } from '@/validators/taskSchema';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';
import { ValidationError } from '@/lib/errors/AppError';
import { requireAuth, requireProjectAccess } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) {
      return apiSuccess([]);
    }

    await requireProjectAccess(projectId);
    const tasks = await TaskService.fetchProjectTasks(projectId);
    return apiSuccess(tasks);
  } catch (err: unknown) {
    return handleApiError(err, 'api/tasks:GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const input = await validateRequestBody(createTaskSchema, request);
    if (input.project_id) {
      await requireProjectAccess(input.project_id);
    }
    const created = await TaskService.createTask(input);
    return apiSuccess(created, 201);
  } catch (err: unknown) {
    return handleApiError(err, 'api/tasks:POST');
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    const input = await validateRequestBody(updateTaskSchema, request);
    const { id, ...updates } = input;
    if (input.project_id) {
      await requireProjectAccess(input.project_id);
    }
    const updated = await TaskService.updateTask(id, updates);
    return apiSuccess(updated);
  } catch (err: unknown) {
    return handleApiError(err, 'api/tasks:PUT');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      throw new ValidationError('Task ID parameter is required for deletion');
    }

    await TaskService.deleteTask(id);
    return apiSuccess({ deleted: true });
  } catch (err: unknown) {
    return handleApiError(err, 'api/tasks:DELETE');
  }
}
