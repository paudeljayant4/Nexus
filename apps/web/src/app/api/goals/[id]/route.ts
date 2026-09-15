import { NextRequest, NextResponse } from 'next/server';
import { goalRepository } from '@nexus/database';
import { validate } from '@nexus/validation';
import { UpdateGoalSchema } from '@nexus/types';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const goal = await goalRepository.findById(params.id);
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    if (goal.userId !== user.userId) return unauthorizedResponse();

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Failed to fetch goal:', error);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const goal = await goalRepository.findById(params.id);
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    if (goal.userId !== user.userId) return unauthorizedResponse();

    const body = await request.json();
    const validation = validate(UpdateGoalSchema, body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.flatten() }, { status: 400 });
    }

    const updatedGoal = await goalRepository.update(params.id, validation.data);
    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Failed to update goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const goal = await goalRepository.findById(params.id);
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    if (goal.userId !== user.userId) return unauthorizedResponse();

    await goalRepository.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete goal:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
