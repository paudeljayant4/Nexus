import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { taskRepository, taskCommentRepository } from '@nexus/database';
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

    const comments = await taskCommentRepository.findByTaskId(params.id);
    return Response.json({ data: comments, error: null });
  } catch (error) {
    console.error('Error fetching comments:', error);
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
      taskId: params.id,
      userId: user.userId,
    };

    const validation = validate(validators.createTaskComment, dataWithDefaults);
    if (!validation.success) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } },
        { status: 400 }
      );
    }

    const comment = await taskCommentRepository.create({ taskId: params.id, userId: user.userId, content: validation.data.content });
    return Response.json({ data: comment, error: null }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
