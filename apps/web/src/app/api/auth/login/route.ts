import { NextRequest, NextResponse } from 'next/server';
import { validate } from '@nexus/validation';
import { LoginSchema } from '@nexus/types';
import { verifyPassword } from '@nexus/auth';
import { prisma } from '@nexus/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, { status: 401 });
    }

    const { createToken } = await import('@nexus/auth');
    const token = await createToken({ id: user.id, email: user.email, name: user.name });

    return NextResponse.json({
      data: {
        user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl ?? undefined },
        token,
      },
    });
  } catch (error) {
    console.error('Failed to authenticate user:', error);
    return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 });
  }
}
