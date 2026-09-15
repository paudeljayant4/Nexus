import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { taskRepository, habitRepository, goalRepository } from '@nexus/database';
import { prisma } from '@nexus/database';
import { WeeklyReport } from '@nexus/types';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();
    if (user.userId !== params.userId) return unauthorizedResponse();

    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const tasksCompleted = await taskRepository.countCompletedInRange(params.userId, weekStart, weekEnd);
    const tasksCreated = await taskRepository.countCreatedInRange(params.userId, weekStart, weekEnd);

    const goals = await goalRepository.findByUserId(params.userId);
    const goalsProgress = [];
    for (const goal of goals.slice(0, 5)) {
      const total = await goalRepository.countTasks(goal.id);
      const completed = await goalRepository.countCompletedTasks(goal.id);
      goalsProgress.push({
        title: goal.title,
        progress: total > 0 ? completed / total : 0,
      });
    }

    const habits = await habitRepository.findByUserId(params.userId);
    let habitsCompleted = 0;
    for (const habit of habits) {
      const logs = await habitRepository.getLogs(habit.id, weekStart, weekEnd);
      habitsCompleted += logs.length;
    }
    const habitsRate = habits.length > 0 ? Math.min(habitsCompleted / (habits.length * 7), 1) : 0;

    const insights: string[] = [];
    if (tasksCompleted > 10) {
      insights.push(`Great week! You completed ${tasksCompleted} tasks.`);
    }
    if (tasksCreated > tasksCompleted * 1.5) {
      insights.push('You created more tasks than you completed. Consider reviewing your backlog.');
    }
    if (habitsRate > 0.8) {
      insights.push('Excellent habit consistency this week!');
    }
    if (habitsRate < 0.3 && habits.length > 0) {
      insights.push('Habit adherence was low. Try focusing on fewer habits.');
    }

    const taskCompletionRate = tasksCreated > 0 ? tasksCompleted / tasksCreated : 0;
    const productivityScore = Math.round(
      (taskCompletionRate * 40 + habitsRate * 30 + (goalsProgress.length > 0
        ? goalsProgress.reduce((sum, g) => sum + g.progress, 0) / goalsProgress.length * 30
        : 30)) * 100
    );

    const report: WeeklyReport = {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      tasksCompleted,
      tasksCreated,
      goalsProgress,
      habitsCompleted,
      habitsRate,
      insights,
      productivityScore: Math.min(productivityScore, 100),
    };

    return Response.json({ data: report, error: null });
  } catch (error) {
    console.error('Error fetching weekly report:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
