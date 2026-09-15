import { NextRequest, NextResponse } from 'next/server';
import { goalRepository } from '@nexus/database';
import { validate } from '@nexus/validation';
import { CreateGoalSchema, UpdateGoalSchema } from '@nexus/types';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const goals = await goalRepository.findByUserId(params.userId);
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
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
      status: body.status ?? 'ACTIVE',
      priority: body.priority ?? 5,
    };
    const validation = validate(CreateGoalSchema, dataWithDefaults);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.flatten() }, { status: 400 });
    }

    const goal = await goalRepository.create(validation.data);
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Failed to create goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
