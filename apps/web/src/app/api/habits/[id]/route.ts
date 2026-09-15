import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { habitRepository } from '@nexus/database';
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

    const stats = await habitRepository.getStats(params.id);
    return Response.json({ data: { ...habit, stats }, error: null });
  } catch (error) {
    console.error('Error fetching habit:', error);
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
    const validation = validate(validators.updateHabit, body);
    if (!validation.success) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } },
        { status: 400 }
      );
    }

    const updatedHabit = await habitRepository.update(params.id, validation.data);
    return Response.json({ data: updatedHabit, error: null });
  } catch (error) {
    console.error('Error updating habit:', error);
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

    await habitRepository.delete(params.id);
    return Response.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
