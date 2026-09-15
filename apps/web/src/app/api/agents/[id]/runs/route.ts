import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { agentRepository } from '@nexus/database';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const agent = await agentRepository.findById(params.id);
    if (!agent) {
      return Response.json({ data: null, error: { code: 'NOT_FOUND', message: 'Agent not found' } }, { status: 404 });
    }
    if (agent.userId !== user.userId) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const runs = await agentRepository.getRuns(params.id, limit);
    return Response.json({ data: runs, error: null });
  } catch (error) {
    console.error('Error fetching agent runs:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
