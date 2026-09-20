import { NextRequest } from 'next/server';
import { ProjectService } from '@/services/projectService';
import { createProjectSchema, updateProjectSchema } from '@/validators/project';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';
import { ValidationError } from '@/lib/errors/AppError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const userId = url.searchParams.get('user_id');

    if (id) {
      const project = await ProjectService.fetchProjectById(id);
      return apiSuccess(project);
    }

    if (!userId) {
      return apiSuccess([]);
    }

    const projects = await ProjectService.fetchUserProjects(userId);
    return apiSuccess(projects);
  } catch (err: unknown) {
    return handleApiError(err, 'api/projects:GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await validateRequestBody(createProjectSchema, request);
    const saved = await ProjectService.saveProject(input);
    return apiSuccess(saved, 201);
  } catch (err: unknown) {
    return handleApiError(err, 'api/projects:POST');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const input = await validateRequestBody(updateProjectSchema, request);
    const { id, ...updates } = input;
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

    await ProjectService.deleteProject(id);
    return apiSuccess({ deleted: true });
  } catch (err: unknown) {
    return handleApiError(err, 'api/projects:DELETE');
  }
}
