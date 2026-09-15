import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { userSettingRepository } from '@nexus/database';
import { validate, validators } from '@nexus/validation';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const settings = await userSettingRepository.findByUserId(params.userId);
    return Response.json({ data: settings, error: null });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const body = await request.json();
    const validation = validate(validators.updateUserSetting, body);
    if (!validation.success) {
      return Response.json({ data: null, error: { code: 'VALIDATION_ERROR', message: validation.errors.flatten() } }, { status: 400 });
    }

    const settings = await userSettingRepository.createOrUpdate(params.userId, validation.data);
    return Response.json({ data: settings, error: null });
  } catch (error) {
    console.error('Error updating settings:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
