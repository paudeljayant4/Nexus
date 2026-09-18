import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { prisma, taskRepository } from '@nexus/database';
import { validate, validators } from '@nexus/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const task = await taskRepository.findById(params.id);
    if (!task) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 }
      );
    }

    if (task.userId !== user.userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = validate(validators.reorderTasks, body);
    if (!validation.success) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } },
        { status: 400 }
      );
    }

    const requestedTaskIds = new Set(validation.data.taskIds);
    const ownedTaskCount = await prisma.task.count({
      where: {
        id: { in: Array.from(requestedTaskIds) },
        userId: user.userId,
      },
    });

    if (ownedTaskCount !== requestedTaskIds.size) {
      return Response.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'All reordered tasks must belong to the authenticated user' } },
        { status: 403 }
      );
    }

    await taskRepository.reorder(validation.data.taskIds);
    return Response.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Error reordering subtasks:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
