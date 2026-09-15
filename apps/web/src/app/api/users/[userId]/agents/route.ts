import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { agentRepository } from '@nexus/database';
import { validate, validators } from '@nexus/validation';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const agents = await agentRepository.findByUserId(params.userId);
    return Response.json({ data: agents, error: null });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const body = await request.json();
    const validation = validate(validators.createAgent, body);
    if (!validation.success) {
      return Response.json({ data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } }, { status: 400 });
    }

    const agent = await agentRepository.create(params.userId, validation.data);
    return Response.json({ data: agent, error: null }, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
