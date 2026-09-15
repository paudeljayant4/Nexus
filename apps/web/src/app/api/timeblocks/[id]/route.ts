import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { prisma, timeBlockRepository } from '@nexus/database';
import { validate, validators } from '@nexus/validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const timeBlock = await prisma.timeBlock.findUnique({ where: { id: params.id } });
    if (!timeBlock) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Time block not found' } },
        { status: 404 }
      );
    }

    if (timeBlock.userId !== user.userId) return unauthorizedResponse();

    const body = await request.json();
    const validation = validate(validators.updateTimeBlock, body);
    if (!validation.success) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } },
        { status: 400 }
      );
    }

    const updatedTimeBlock = await timeBlockRepository.update(params.id, validation.data);
    return Response.json({ data: updatedTimeBlock, error: null });
  } catch (error) {
    console.error('Error updating time block:', error);
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

    const timeBlock = await prisma.timeBlock.findUnique({ where: { id: params.id } });
    if (!timeBlock) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Time block not found' } },
        { status: 404 }
      );
    }

    if (timeBlock.userId !== user.userId) return unauthorizedResponse();

    await timeBlockRepository.delete(params.id);
    return Response.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Error deleting time block:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
