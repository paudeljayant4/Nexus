import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { taskRepository, timeBlockRepository } from '@nexus/database';
import { validate, validators } from '@nexus/validation';
import { getAIGateway } from '@nexus/ai';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const validation = validate(validators.autoSchedule, body);
    if (!validation.success) {
      return Response.json({ data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } }, { status: 400 });
    }

    const { date, availableHours, focusMode } = validation.data;
    const dateObj = new Date(date);
    const startHour = availableHours ? parseInt(availableHours.start.split(':')[0], 10) : 9;
    const endHour = availableHours ? parseInt(availableHours.end.split(':')[0], 10) : 17;

    const pendingTasks = await taskRepository.findByUserId(user.userId, ['PENDING', 'IN_PROGRESS']);
    const scheduledTasks = pendingTasks.filter(t => !t.scheduledDate || new Date(t.scheduledDate).toDateString() === dateObj.toDateString());

    const gateway = getAIGateway();
    let timeBlocks: Array<{ taskId: string; startTime: string; endTime: string; title: string }> = [];

    if (gateway && scheduledTasks.length > 0) {
      try {
        const response = await gateway.generate({
          prompt: `Schedule these tasks for ${date} between ${startHour}:00 and ${endHour}:00.\n\nTasks: ${JSON.stringify(scheduledTasks.map(t => ({ id: t.id, title: t.title, estimatedMinutes: t.estimatedMinutes ?? 30, priority: t.priority })))}\n\nFocus mode: ${focusMode ?? false}\n\nReturn a JSON array of time blocks with: taskId, startTime (HH:mm), endTime (HH:mm), title.`,
          systemPrompt: 'You are a scheduling assistant. Create efficient time blocks without overlaps.',
          jsonMode: true,
        });
        const parsed = JSON.parse(response.content);
        timeBlocks = Array.isArray(parsed) ? parsed : [];
      } catch {
        let currentHour = startHour;
        for (const task of scheduledTasks) {
          const duration = task.estimatedMinutes ?? 30;
          const endMinutes = currentHour * 60 + duration;
          if (endMinutes > endHour * 60) break;
          timeBlocks.push({
            taskId: task.id,
            startTime: `${String(currentHour).padStart(2, '0')}:00`,
            endTime: `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`,
            title: task.title,
          });
          currentHour = Math.floor(endMinutes / 60) + (endMinutes % 60 > 0 ? 1 : 0);
        }
      }
    } else {
      let currentHour = startHour;
      for (const task of scheduledTasks) {
        const duration = task.estimatedMinutes ?? 30;
        const endMinutes = currentHour * 60 + duration;
        if (endMinutes > endHour * 60) break;
        timeBlocks.push({
          taskId: task.id,
          startTime: `${String(currentHour).padStart(2, '0')}:00`,
          endTime: `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`,
          title: task.title,
        });
        currentHour = Math.floor(endMinutes / 60) + (endMinutes % 60 > 0 ? 1 : 0);
      }
    }

    const rangeStart = new Date(`${date}T00:00:00`);
    const rangeEnd = new Date(`${date}T23:59:59.999`);
    const existingBlocks = await timeBlockRepository.findByUserId(user.userId, rangeStart, rangeEnd);
    const scheduledTaskIds = new Set(
      existingBlocks.flatMap((block) => block.taskId ? [block.taskId] : [])
    );

    const createdBlocks = [];
    for (const block of timeBlocks.filter((block) => !scheduledTaskIds.has(block.taskId))) {
      const startDateTime = new Date(`${date}T${block.startTime}:00`);
      const endDateTime = new Date(`${date}T${block.endTime}:00`);
      const created = await timeBlockRepository.create(user.userId, {
        taskId: block.taskId,
        title: block.title,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });
      createdBlocks.push(created);
    }

    return Response.json({ data: { date, timeBlocks: createdBlocks }, error: null });
  } catch (error) {
    console.error('Error auto-scheduling:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
