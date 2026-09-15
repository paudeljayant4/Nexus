import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { timeBlockRepository } from '@nexus/database';
import { validate, validators } from '@nexus/validation';

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

    const timeBlocks = await timeBlockRepository.findByUserId(params.userId, new Date(startDate), new Date(endDate));
    return Response.json({ data: timeBlocks, error: null });
  } catch (error) {
    console.error('Error fetching time blocks:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

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

    const validation = validate(validators.createTimeBlock, dataWithUserId);
    if (!validation.success) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } },
        { status: 400 }
      );
    }

    const timeBlock = await timeBlockRepository.create(params.userId, validation.data);
    return Response.json({ data: timeBlock, error: null }, { status: 201 });
  } catch (error) {
    console.error('Error creating time block:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
