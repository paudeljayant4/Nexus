import { NextRequest, NextResponse } from 'next/server';
import { goalRepository, taskRepository, taskEventRepository } from '@nexus/database';
import { getAIGateway, summarizeOutcomeHistory } from '@nexus/ai';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const gateway = getAIGateway();
    if (!gateway) {
      return NextResponse.json({ error: 'No AI provider is configured' }, { status: 503 });
    }

    const [goals, tasks, pastEvents] = await Promise.all([
      goalRepository.findByUserId(params.userId),
      taskRepository.findByUserId(params.userId, ['PENDING', 'IN_PROGRESS']),
      taskEventRepository.findByUserId(params.userId, 20),
    ]);

    const outcomeSummary = summarizeOutcomeHistory(pastEvents);

    if (tasks.length === 0) {
      return NextResponse.json([]);
    }

    const rankings = await gateway.rankTasks({
      goals,
      tasks,
      now: new Date().toISOString(),
      pastEvents,
      outcomeSummary: outcomeSummary ?? undefined,
    });

    await Promise.all(rankings.map(r => 
      taskEventRepository.create({
        taskId: r.taskId,
        userId: params.userId,
        type: 'RANKED',
        metadata: { rank: r.rank, reason: r.reason, confidence: r.confidence },
      })
    ));

    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Failed to rank tasks:', error);
    return NextResponse.json({ error: 'Failed to rank tasks' }, { status: 500 });
  }
}
