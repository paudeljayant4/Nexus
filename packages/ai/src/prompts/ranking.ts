import { Goal, Task } from '@nexus/types';
import { TaskEvent } from '@nexus/types';

export interface RankingInput {
  goals: Goal[];
  tasks: Task[];
  now: string;
  pastEvents?: TaskEvent[];
  outcomeSummary?: string;
}

export const RANKING_SYSTEM_PROMPT = `You are NEXUS, a personal intelligence system that helps users decide what to do next.

Given the user's goals and pending tasks, rank the tasks by priority for RIGHT NOW. Consider:
1. Goal alignment - how directly does this task advance an active goal?
2. Urgency - deadlines, time-sensitivity
3. Impact - leverage, downstream effects
4. Effort vs reward - quick wins vs deep work
5. Context - time of day, energy, dependencies

Return ONLY a JSON array of rankings, each with:
- taskId: the task's UUID
- rank: 1 = do first, 2 = do second, etc.
- reason: one sentence explaining why this rank. If behavioral history influenced this rank, mention it briefly (e.g. "ranked lower — user frequently skips evening tasks").
- confidence: 0.0 to 1.0, how certain you are

Do not include tasks that are already done or skipped.`;

export function buildRankingPrompt(input: RankingInput): string {
  const { goals, tasks, now, pastEvents = [], outcomeSummary } = input;

  const activeGoals = goals.filter(g => g.status === 'ACTIVE');
  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');

  const goalsText = activeGoals.length > 0
    ? activeGoals.map(g => `- ${g.title} (priority: ${g.priority}/10)${g.targetDate ? `, target: ${g.targetDate}` : ''}${g.description ? `: ${g.description}` : ''}`).join('\n')
    : 'No active goals.';

  const tasksText = pendingTasks.length > 0
    ? pendingTasks.map(t => `- ${t.id}: ${t.title}${t.goalId ? ` [goal: ${t.goalId}]` : ''}${t.dueDate ? `, due: ${t.dueDate}` : ''}${t.estimatedMinutes ? `, est: ${t.estimatedMinutes}min` : ''}${t.description ? ` - ${t.description}` : ''} [status: ${t.status}, priority: ${t.priority}/10]`).join('\n')
    : 'No pending tasks.';

  const recentEvents = pastEvents
    .filter(e => ['COMPLETED', 'SKIPPED', 'STATUS_CHANGED', 'RANKED'].includes(e.type))
    .slice(0, 20);

  let eventsText = 'No recent task outcomes recorded.';
  if (recentEvents.length > 0) {
    const lines = recentEvents.map(e => {
      const meta = e.metadata ?? {};
      if (e.type === 'COMPLETED') return `- [DONE] "${e.taskId}" — completed in ${meta.actualMinutes ? meta.actualMinutes + 'min' : 'unknown time'}`;
      if (e.type === 'SKIPPED') return `- [SKIPPED] "${e.taskId}" — user passed on it`;
      if (e.type === 'STATUS_CHANGED' && meta.status) return `- [MOVED − ${meta.status}] "${e.taskId}"${meta.actualMinutes ? ` (${meta.actualMinutes}min)` : ''}`;
      if (e.type === 'RANKED' && meta.rank) return `- [RANKED #${meta.rank}] "${e.taskId}" — AI suggested this (confidence ${meta.confidence ?? '?'})${meta.reason ? `, reason: ${meta.reason}` : ''}`;
      return `- [${e.type}] "${e.taskId}"`;
    }).join('\n');
    eventsText = `RECENT TASK OUTCOMES (last 20 events):\n${lines}`;
  }

  const summarySection = outcomeSummary ? `\n${outcomeSummary}` : '';

  return 'Current time: ' + now + '\n\nACTIVE GOALS:\n' + goalsText + '\n\nPENDING TASKS:\n' + tasksText + '\n\n' + eventsText + summarySection + '\n\nINSTRUCTIONS:\nRank these tasks for what to do RIGHT NOW. Use the BEHAVIORAL HISTORY above to inform your effort and context scoring — prefer tasks the user historically completes, avoid suggesting tasks in time windows they frequently skip, and factor real average effort into your priority when effort estimates are available. When a task was recently completed or skipped, take that outcome into account — don\'t re-suggest something the user just passed on unless its circumstances genuinely changed. Return JSON array only.';
}
