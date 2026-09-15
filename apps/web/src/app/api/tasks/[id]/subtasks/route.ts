import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { taskRepository } from '@nexus/database';
import { validate, validators } from '@nexus/validation';

export async function GET(
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

    const subtasks = await taskRepository.findSubtasks(params.id);
    return Response.json({ data: subtasks, error: null });
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

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
    const dataWithDefaults = {
      ...body,
      userId: user.userId,
      parentId: params.id,
      status: body.status ?? 'PENDING',
      priority: body.priority ?? 5,
    };

    const validation = validate(validators.createTask, dataWithDefaults);
    if (!validation.success) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } },
        { status: 400 }
      );
    }

    const subtask = await taskRepository.create(validation.data);
    return Response.json({ data: subtask, error: null }, { status: 201 });
  } catch (error) {
    console.error('Error creating subtask:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
