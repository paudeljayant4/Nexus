import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { habitRepository } from '@nexus/database';
import { validate, validators } from '@nexus/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const habits = await habitRepository.findByUserId(params.userId);
    return NextResponse.json({ data: habits, error: null });
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const dataWithUserId = { ...body, userId: params.userId };

    const validation = validate(validators.createHabit, dataWithUserId);
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.flatten() }, { status: 400 });
    }

    const habit = await habitRepository.create(params.userId, validation.data);
    return NextResponse.json({ data: habit, error: null }, { status: 201 });
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
