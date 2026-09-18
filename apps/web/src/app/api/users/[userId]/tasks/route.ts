import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@nexus/database';
import { validate } from '@nexus/validation';
import { CreateTaskSchema, TaskStatus, TaskStatusSchema } from '@nexus/types';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const requestedStatuses = searchParams.get('statuses')?.split(',');
    const parsedStatuses = requestedStatuses?.map((status) => {
      const parsed = TaskStatusSchema.safeParse(status);
      return parsed.success ? parsed.data : null;
    });

    if (parsedStatuses?.some((status) => status === null)) {
      return NextResponse.json({ error: 'Invalid task status filter' }, { status: 400 });
    }

    const statuses = parsedStatuses as TaskStatus[] | undefined;
    const tasks = await taskRepository.findByUserId(params.userId, statuses);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const body = await request.json();
    const dataWithDefaults = {
      ...body,
      userId: params.userId,
      status: body.status ?? 'PENDING',
      priority: body.priority ?? 5,
    };
    const validation = validate(CreateTaskSchema, dataWithDefaults);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.flatten() }, { status: 400 });
    }

    const task = await taskRepository.create(validation.data);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
