import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorizedResponse } from '@nexus/auth';
import { taskRepository, habitRepository, goalRepository } from '@nexus/database';
import { getAIGateway } from '@nexus/ai';
import { DailyBriefing } from '@nexus/types';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const date = body.date ?? new Date().toISOString().split('T')[0];
    const dateObj = new Date(date);

    const tasks = await taskRepository.findByDate(user.userId, dateObj);
    const habits = await habitRepository.findByUserId(user.userId);
    const goals = await goalRepository.findByUserId(user.userId);

    const topPriorities = tasks
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
      .map(t => ({ id: t.id, title: t.title, reason: `Priority ${t.priority}` }));

    const habitReminders = [];
    for (const habit of habits.slice(0, 5)) {
      const stats = await habitRepository.getStats(habit.id);
      habitReminders.push({
        id: habit.id,
        name: habit.name,
        streak: stats.currentStreak,
      });
    }

    const goalProgress = [];
    for (const goal of goals.slice(0, 5)) {
      const totalTasks = await goalRepository.countTasks(goal.id);
      const completedCount = await goalRepository.countCompletedTasks(goal.id);
      goalProgress.push({
        id: goal.id,
        title: goal.title,
        progress: totalTasks > 0 ? completedCount / totalTasks : 0,
        taskCount: totalTasks,
        completedCount,
      });
    }

    let suggestions: string[] = [];
    const gateway = getAIGateway();
    if (gateway) {
      try {
        const response = await gateway.generate({
          prompt: `Generate 3-5 brief productivity suggestions for today based on:\n\nTasks: ${JSON.stringify(tasks.slice(0, 10))}\nHabits: ${JSON.stringify(habits.slice(0, 5))}\nGoals: ${JSON.stringify(goals.slice(0, 5))}\n\nReturn a JSON array of suggestion strings.`,
          systemPrompt: 'You are a productivity assistant. Give concise, actionable suggestions.',
          jsonMode: true,
        });
        const parsed = JSON.parse(response.content);
        suggestions = Array.isArray(parsed) ? parsed : [];
      } catch {
        suggestions = ['Review your top priorities for today', 'Stay consistent with your habits'];
      }
    } else {
      suggestions = ['Review your top priorities for today', 'Stay consistent with your habits'];
    }

    const briefing: DailyBriefing = {
      date,
      topPriorities,
      habitReminder: habitReminders,
      goalProgress,
      suggestions,
    };

    return Response.json({ data: briefing, error: null });
  } catch (error) {
    console.error('Error generating briefing:', error);
    return Response.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
