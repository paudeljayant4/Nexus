import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { prisma, tagRepository } from '@nexus/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const tag = await prisma.tag.findUnique({ where: { id: params.id } });
    if (!tag) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Tag not found' } },
        { status: 404 }
      );
    }

    if (tag.userId !== user.userId) {
      return unauthorizedResponse();
    }

    await tagRepository.delete(params.id);
    return Response.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
