import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { habitRepository } from '@nexus/database';
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

    const habit = await habitRepository.findById(params.id);
    if (!habit) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Habit not found' } },
        { status: 404 }
      );
    }

    if (habit.userId !== user.userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const dataWithHabitId = { ...body, habitId: params.id };

    const validation = validate(validators.logHabit, dataWithHabitId);
    if (!validation.success) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } },
        { status: 400 }
      );
    }

    const logEntry = await habitRepository.logCompletion(user.userId, params.id, validation.data);
    return Response.json({ data: logEntry, error: null }, { status: 201 });
  } catch (error) {
    console.error('Error logging habit completion:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
