import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { agentRepository, taskRepository, goalRepository } from '@nexus/database';
import { getAIGateway } from '@nexus/ai';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const agent = await agentRepository.findById(params.id);
    if (!agent) {
      return Response.json({ data: null, error: { code: 'NOT_FOUND', message: 'Agent not found' } }, { status: 404 });
    }
    if (agent.userId !== user.userId) return unauthorizedResponse();

    const run = await agentRepository.createRun({
      agentId: agent.id,
      userId: user.userId,
      input: {},
    });

    let output: Record<string, unknown> = {};

    try {
      switch (agent.type) {
        case 'SCHEDULER': {
          const tasks = await taskRepository.findByUserId(user.userId, ['PENDING', 'IN_PROGRESS']);
          const goals = await goalRepository.findByUserId(user.userId);
          output = {
            scheduledTasks: tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority })),
            activeGoals: goals.map(g => ({ id: g.id, title: g.title })),
            message: 'Tasks analyzed for scheduling',
          };
          break;
        }
        case 'SUGGESTER': {
          const tasks = await taskRepository.findByUserId(user.userId, ['PENDING', 'IN_PROGRESS']);
          const goals = await goalRepository.findByUserId(user.userId);
          const gateway = getAIGateway();
          if (gateway) {
            const response = await gateway.generate({
              prompt: `Based on these tasks and goals, suggest what the user should focus on next:\n\nTasks: ${JSON.stringify(tasks.slice(0, 10))}\nGoals: ${JSON.stringify(goals)}`,
              systemPrompt: 'You are a productivity assistant. Give concise, actionable suggestions.',
              jsonMode: true,
            });
            output = { suggestions: response.content };
          } else {
            output = {
              suggestions: tasks.slice(0, 3).map(t => `Focus on: ${t.title}`),
              message: 'AI gateway not available, using fallback',
            };
          }
          break;
        }
        case 'ANALYZER': {
          const tasks = await taskRepository.findByUserId(user.userId);
          const completed = tasks.filter(t => t.status === 'DONE');
          const pending = tasks.filter(t => t.status !== 'DONE');
          output = {
            totalTasks: tasks.length,
            completedCount: completed.length,
            pendingCount: pending.length,
            completionRate: tasks.length > 0 ? completed.length / tasks.length : 0,
            averagePriority: pending.length > 0
              ? pending.reduce((sum, t) => sum + t.priority, 0) / pending.length
              : 0,
          };
          break;
        }
        case 'ASSISTANT':
        default: {
          const gateway = getAIGateway();
          if (gateway) {
            const response = await gateway.generate({
              prompt: 'You are a general productivity assistant. How can I help you today?',
              systemPrompt: 'You are NEXUS, a personal intelligence system. Be helpful and concise.',
              jsonMode: false,
            });
            output = { response: response.content };
          } else {
            output = { response: 'AI gateway not available. Please configure an AI provider.' };
          }
          break;
        }
      }

      const completedRun = await agentRepository.completeRun(run.id, output);
      return Response.json({ data: completedRun, error: null });
    } catch (runError) {
      const errorMessage = runError instanceof Error ? runError.message : 'Agent execution failed';
      await agentRepository.failRun(run.id, errorMessage);
      return Response.json({ data: null, error: { code: 'AGENT_RUN_FAILED', message: errorMessage } }, { status: 500 });
    }
  } catch (error) {
    console.error('Error running agent:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
