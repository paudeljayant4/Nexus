import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { insightRepository } from '@nexus/database';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const insights = await insightRepository.findByUserId(params.userId, unreadOnly);
    return Response.json({ data: insights, error: null });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const body = await request.json();
    const { type, title, content, data, priority } = body;

    if (!type || !title || !content) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'type, title, and content are required' } },
        { status: 400 }
      );
    }

    const insight = await insightRepository.create({
      userId: params.userId,
      type,
      title,
      content,
      data,
      priority,
    });

    return Response.json({ data: insight, error: null }, { status: 201 });
  } catch (error) {
    console.error('Error creating insight:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
