import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { prisma, taskRepository, tagRepository } from '@nexus/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const task = await taskRepository.findById(params.id);
    if (!task) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 }
      );
    }

    if (task.userId !== user.userId) return unauthorizedResponse();

    const tags = await tagRepository.findByTaskId(params.id);
    return Response.json({ data: tags, error: null });
  } catch (error) {
    console.error('Error fetching tags:', error);
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
    if (!user) return unauthorizedResponse();

    const task = await taskRepository.findById(params.id);
    if (!task) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 }
      );
    }

    if (task.userId !== user.userId) return unauthorizedResponse();

    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'tagId is required' } },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Tag not found' } },
        { status: 404 }
      );
    }

    if (tag.userId !== user.userId) return unauthorizedResponse();

    await tagRepository.addToTask(params.id, tagId);
    return Response.json({ data: { success: true }, error: null }, { status: 201 });
  } catch (error) {
    console.error('Error adding tag to task:', error);
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

    const task = await taskRepository.findById(params.id);
    if (!task) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 }
      );
    }

    if (task.userId !== user.userId) return unauthorizedResponse();

    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'tagId is required' } },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Tag not found' } },
        { status: 404 }
      );
    }

    if (tag.userId !== user.userId) return unauthorizedResponse();

    await tagRepository.removeFromTask(params.id, tagId);
    return Response.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Error removing tag from task:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
