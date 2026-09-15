import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { prisma, knowledgeRepository } from '@nexus/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const node = await prisma.knowledgeNode.findUnique({ where: { id: params.id } });
    if (!node) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Node not found' } },
        { status: 404 }
      );
    }

    if (node.userId !== user.userId) return unauthorizedResponse();

    const connectedNodes = await knowledgeRepository.findConnected(params.id);

    return Response.json({ data: connectedNodes, error: null });
  } catch (error) {
    console.error('Error fetching connected nodes:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const node = await prisma.knowledgeNode.findUnique({ where: { id: params.id } });
    if (!node) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Node not found' } },
        { status: 404 }
      );
    }

    if (node.userId !== user.userId) return unauthorizedResponse();

    await knowledgeRepository.deleteNode(params.id);

    return Response.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Error deleting node:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
