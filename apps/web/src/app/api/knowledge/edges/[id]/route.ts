import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { prisma } from '@nexus/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const edge = await prisma.knowledgeEdge.findUnique({
      where: { id: params.id },
      include: { source: true },
    });

    if (!edge) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Edge not found' } },
        { status: 404 }
      );
    }

    if (edge.source.userId !== user.userId) return unauthorizedResponse();

    await prisma.knowledgeEdge.delete({ where: { id: params.id } });

    return Response.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Error deleting edge:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
