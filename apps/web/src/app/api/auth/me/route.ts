import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@nexus/auth';
import { prisma } from '@nexus/database';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return NextResponse.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatarUrl: dbUser.avatarUrl ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to get current user:', error);
    return NextResponse.json({ error: 'Failed to get current user' }, { status: 500 });
  }
}
