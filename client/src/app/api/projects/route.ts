import { NextRequest } from 'next/server';
import { ProjectService } from '@/services/projectService';
import { createProjectSchema, updateProjectSchema } from '@/validators/project';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';
import { ValidationError, ForbiddenError } from '@/lib/errors/AppError';
import { requireAuth, requireProjectAccess } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      const project = await ProjectService.fetchProjectById(id);
      // Enforce project ownership boundary
      if (project.user_id && project.user_id !== userId) {
        throw new ForbiddenError('Access denied: You do not own this project');
      }
      return apiSuccess(project);
    }

    const projects = await ProjectService.fetchUserProjects(userId);
    return apiSuccess(projects);
  } catch (err: unknown) {
    return handleApiError(err, 'api/projects:GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const input = await validateRequestBody(createProjectSchema, request);
    // Attach authenticated user_id automatically
    const saved = await ProjectService.saveProject({ ...input, user_id: userId });
    return apiSuccess(saved, 201);
  } catch (err: unknown) {
    return handleApiError(err, 'api/projects:POST');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const input = await validateRequestBody(updateProjectSchema, request);
    const { id, ...updates } = input;
    await requireProjectAccess(id);
    const updated = await ProjectService.updateProject(id, updates);
    return apiSuccess(updated);
  } catch (err: unknown) {
    return handleApiError(err, 'api/projects:PUT');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      throw new ValidationError('ID parameter is required for deletion');
    }

    await requireProjectAccess(id);
    await ProjectService.deleteProject(id);
    return apiSuccess({ deleted: true });
  } catch (err: unknown) {
    return handleApiError(err, 'api/projects:DELETE');
  }
}
