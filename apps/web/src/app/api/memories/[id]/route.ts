import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { memoryRepository } from '@nexus/database';
import { validate, validators } from '@nexus/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const memory = await memoryRepository.findById(params.id);
    if (!memory) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Memory not found' } },
        { status: 404 }
      );
    }

    if (memory.userId !== user.userId) return unauthorizedResponse();

    return Response.json({ data: memory, error: null });
  } catch (error) {
    console.error('Error fetching memory:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const existing = await memoryRepository.findById(params.id);
    if (!existing) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Memory not found' } },
        { status: 404 }
      );
    }

    if (existing.userId !== user.userId) return unauthorizedResponse();

    const body = await request.json();
    const validation = validate(validators.updateMemory, body);
    if (!validation.success) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors } },
        { status: 400 }
      );
    }

    const updated = await memoryRepository.update(params.id, validation.data);

    return Response.json({ data: updated, error: null });
  } catch (error) {
    console.error('Error updating memory:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const existing = await memoryRepository.findById(params.id);
    if (!existing) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Memory not found' } },
        { status: 404 }
      );
    }

    if (existing.userId !== user.userId) return unauthorizedResponse();

    await memoryRepository.delete(params.id);

    return Response.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
