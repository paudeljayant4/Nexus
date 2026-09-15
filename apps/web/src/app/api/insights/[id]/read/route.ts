import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { insightRepository } from '@nexus/database';
import { prisma } from '@nexus/database';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const insight = await prisma.insight.findUnique({ where: { id: params.id } });
    if (!insight) {
      return Response.json({ data: null, error: { code: 'NOT_FOUND', message: 'Insight not found' } }, { status: 404 });
    }
    if (insight.userId !== user.userId) return unauthorizedResponse();

    await insightRepository.markRead(params.id);
    return Response.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Error marking insight as read:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
