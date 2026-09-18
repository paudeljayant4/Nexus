import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { dailyPlanRepository, timeBlockRepository } from '@nexus/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.userId !== params.userId) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'startDate and endDate are required' } },
        { status: 400 }
      );
    }

    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    const dateOnlyEnd = /^\d{4}-\d{2}-\d{2}$/.test(endDate);
    if (dateOnlyEnd) {
      rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);
    }
    const planEnd = dateOnlyEnd ? new Date(rangeEnd.getTime() - 1) : rangeEnd;

    const [plans, timeBlocks] = await Promise.all([
      dailyPlanRepository.findInRange(params.userId, rangeStart, planEnd),
      timeBlockRepository.findByUserId(params.userId, rangeStart, rangeEnd),
    ]);

    return Response.json({ data: { plans, timeBlocks }, error: null });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
