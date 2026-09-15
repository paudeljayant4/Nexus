import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { dailyPlanRepository } from '@nexus/database';
import { validate, validators } from '@nexus/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.userId !== params.userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const dataWithUserId = { ...body, userId: params.userId };

    const validation = validate(validators.createDailyPlan, dataWithUserId);
    if (!validation.success) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } },
        { status: 400 }
      );
    }

    const plan = await dailyPlanRepository.createOrUpdate(params.userId, validation.data);
    return Response.json({ data: plan, error: null }, { status: 201 });
  } catch (error) {
    console.error('Error creating daily plan:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
