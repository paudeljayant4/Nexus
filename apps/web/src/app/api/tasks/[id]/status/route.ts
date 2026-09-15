import { NextRequest, NextResponse } from 'next/server';
import { taskRepository, taskEventRepository } from '@nexus/database';
import { z } from 'zod';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';

const StatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED']),
  actualMinutes: z.number().int().positive().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const task = await taskRepository.findById(params.id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (task.userId !== user.userId) return unauthorizedResponse();

    const body = await request.json();
    const result = StatusUpdateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const updatedTask = await taskRepository.updateStatus(params.id, result.data.status, result.data.actualMinutes);
    
    await taskEventRepository.create({
      taskId: params.id,
      userId: updatedTask.userId,
      type: result.data.status === 'DONE' ? 'COMPLETED' : result.data.status === 'SKIPPED' ? 'SKIPPED' : 'STATUS_CHANGED',
      metadata: { status: result.data.status, actualMinutes: result.data.actualMinutes },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task status:', error);
    return NextResponse.json({ error: 'Failed to update task status' }, { status: 500 });
  }
}
