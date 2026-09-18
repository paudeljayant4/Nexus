import { NextRequest, NextResponse } from 'next/server';
import { validate } from '@nexus/validation';
import { CreateUserSchema } from '@nexus/types';
import { hashPassword, createToken } from '@nexus/auth';
import { prisma } from '@nexus/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dataWithDefaults = {
      ...body,
      status: body.status ?? 'ACTIVE',
      priority: body.priority ?? 5,
    };
    const validation = validate(CreateUserSchema, dataWithDefaults);

    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.flatten() }, { status: 400 });
    }

    const { email, password, name } = validation.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: { code: 'USER_EXISTS', message: 'A user with this email already exists' } }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, settings: { create: {} } },
    });

    const token = await createToken({ id: user.id, email: user.email, name: user.name });

    return NextResponse.json({ data: { user: { id: user.id, email: user.email, name: user.name }, token } }, { status: 201 });
  } catch (error) {
    console.error('Failed to register user:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
