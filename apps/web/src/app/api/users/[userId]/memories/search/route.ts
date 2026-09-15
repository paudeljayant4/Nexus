import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { memoryRepository } from '@nexus/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const q = request.nextUrl.searchParams.get('q');
    if (!q) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const limit = request.nextUrl.searchParams.get('limit') ? parseInt(request.nextUrl.searchParams.get('limit')!) : 20;
    const memories = await memoryRepository.search(params.userId, q, limit);

    return NextResponse.json({ data: memories, error: null });
  } catch (error) {
    console.error('Error searching memories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
