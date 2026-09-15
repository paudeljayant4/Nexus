import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { habitRepository } from '@nexus/database';

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
    return Response.json({ data: stats, error: null });
  } catch (error) {
    console.error('Error fetching habit stats:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
