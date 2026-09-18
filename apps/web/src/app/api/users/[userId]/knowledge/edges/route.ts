import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { knowledgeRepository, prisma } from '@nexus/database';
import { validate, validators } from '@nexus/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const body = await request.json();
    const validation = validate(validators.createKnowledgeEdge, body);
    if (!validation.success) {
      return Response.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors } },
        { status: 400 }
      );
    }

    const nodeIds = Array.from(new Set([validation.data.sourceId, validation.data.targetId]));
    const ownedNodes = await prisma.knowledgeNode.findMany({
      where: {
        id: { in: nodeIds },
        userId: user.userId,
      },
      select: { id: true },
    });

    if (ownedNodes.length !== nodeIds.length) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'One or more knowledge nodes were not found' } },
        { status: 404 }
      );
    }

    const edge = await knowledgeRepository.createEdge(validation.data);

    return Response.json({ data: edge, error: null }, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge edge:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
