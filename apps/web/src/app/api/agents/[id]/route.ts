import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { agentRepository } from '@nexus/database';
import { validate, validators } from '@nexus/validation';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const agent = await agentRepository.findById(params.id);
    if (!agent) {
      return Response.json({ data: null, error: { code: 'NOT_FOUND', message: 'Agent not found' } }, { status: 404 });
    }
    if (agent.userId !== user.userId) return unauthorizedResponse();

    return Response.json({ data: agent, error: null });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const agent = await agentRepository.findById(params.id);
    if (!agent) {
      return Response.json({ data: null, error: { code: 'NOT_FOUND', message: 'Agent not found' } }, { status: 404 });
    }
    if (agent.userId !== user.userId) return unauthorizedResponse();

    const body = await request.json();
    const validation = validate(validators.updateAgent, body);
    if (!validation.success) {
      return Response.json({ data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } }, { status: 400 });
    }

    const updated = await agentRepository.update(params.id, validation.data);
    return Response.json({ data: updated, error: null });
  } catch (error) {
    console.error('Error updating agent:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const agent = await agentRepository.findById(params.id);
    if (!agent) {
      return Response.json({ data: null, error: { code: 'NOT_FOUND', message: 'Agent not found' } }, { status: 404 });
    }
    if (agent.userId !== user.userId) return unauthorizedResponse();

    await agentRepository.delete(params.id);
    return Response.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
