import { NextRequest } from 'next/server';
import { RequirementService } from '@/services/requirementService';
import { createRequirementSchema, updateRequirementSchema } from '@/validators/requirementSchema';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';
import { ValidationError } from '@/lib/errors/AppError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) {
      return apiSuccess([]);
    }

    const requirements = await RequirementService.fetchProjectRequirements(projectId);
    return apiSuccess(requirements);
  } catch (err: unknown) {
    return handleApiError(err, 'api/requirements:GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await validateRequestBody(createRequirementSchema, request);
    const created = await RequirementService.createRequirement(input);
    return apiSuccess(created, 201);
  } catch (err: unknown) {
    return handleApiError(err, 'api/requirements:POST');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const input = await validateRequestBody(updateRequirementSchema, request);
    const { id, ...updates } = input;
    const updated = await RequirementService.updateRequirement(id, updates);
    return apiSuccess(updated);
  } catch (err: unknown) {
    return handleApiError(err, 'api/requirements:PUT');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      throw new ValidationError('Requirement ID is required for deletion');
    }

    await RequirementService.deleteRequirement(id);
    return apiSuccess({ deleted: true });
  } catch (err: unknown) {
    return handleApiError(err, 'api/requirements:DELETE');
  }
}
