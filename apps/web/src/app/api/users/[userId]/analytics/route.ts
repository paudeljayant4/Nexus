import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { taskRepository, goalRepository } from '@nexus/database';
import { prisma } from '@nexus/database';
import { ProductivityStats } from '@nexus/types';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const statusCounts = await taskRepository.countByStatus(params.userId);
    const totalTasks = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const completedTasks = statusCounts['DONE'] ?? 0;
    const skippedTasks = statusCounts['SKIPPED'] ?? 0;
    const inProgressTasks = statusCounts['IN_PROGRESS'] ?? 0;
    const pendingTasks = statusCounts['PENDING'] ?? 0;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    const avgEstimate = await prisma.task.aggregate({
      where: { userId: params.userId, estimatedMinutes: { not: null } },
      _avg: { estimatedMinutes: true },
    });

    const avgActual = await prisma.task.aggregate({
      where: { userId: params.userId, actualMinutes: { not: null } },
      _avg: { actualMinutes: true },
    });

    const tasksByDay: Array<{ date: string; completed: number; created: number }> = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      const completed = await taskRepository.countCompletedInRange(params.userId, start, end);
      const created = await taskRepository.countCreatedInRange(params.userId, start, end);
      tasksByDay.push({
        date: day.toISOString().split('T')[0],
        completed,
        created,
      });
    }

    const priorityGroups = await prisma.task.groupBy({
      by: ['priority'],
      where: { userId: params.userId },
      _count: true,
    });
    const tasksByPriority = priorityGroups.map(g => ({ priority: g.priority, count: g._count }));

    const goals = await goalRepository.findByUserId(params.userId);
    const topGoalProgress = [];
    for (const goal of goals.slice(0, 5)) {
      const total = await goalRepository.countTasks(goal.id);
      const completed = await goalRepository.countCompletedTasks(goal.id);
      topGoalProgress.push({
        goalId: goal.id,
        title: goal.title,
        progress: total > 0 ? completed / total : 0,
        totalTasks: total,
        completedTasks: completed,
      });
    }

    const stats: ProductivityStats = {
      totalTasks,
      completedTasks,
      skippedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate,
      avgEstimatedMinutes: avgEstimate._avg.estimatedMinutes,
      avgActualMinutes: avgActual._avg.actualMinutes,
      tasksByDay,
      tasksByPriority,
      topGoalProgress,
    };

    return Response.json({ data: stats, error: null });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
