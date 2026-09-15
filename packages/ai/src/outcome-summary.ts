import { TaskEvent } from '@nexus/types';

const MIN_OUTCOME_EVENTS = 5;
const HISTORY_DAYS = 30;

export function summarizeOutcomeHistory(events: TaskEvent[]): string | null {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_DAYS);

  const recent = events.filter(e => new Date(e.createdAt) >= cutoff);
  if (recent.length < MIN_OUTCOME_EVENTS) return null;

  const completed = recent.filter(e => e.type === 'COMPLETED');
  const skipped = recent.filter(e => e.type === 'SKIPPED');
  const outcomeTotal = completed.length + skipped.length;

  if (outcomeTotal === 0) return null;

  const completionRate = Math.round((completed.length / outcomeTotal) * 100);

  // Average actual minutes for completed tasks that recorded it
  let totalActualMin = 0;
  let completedWithActual = 0;
  for (const e of completed) {
    const m = e.metadata as Record<string, unknown> | undefined;
    if (m?.actualMinutes != null) {
      totalActualMin += Number(m.actualMinutes);
      completedWithActual++;
    }
  }

  // Time-of-day clustering for skips (hour 0-23)
  const skipHourCounts: Record<number, number> = {};
  for (const e of skipped) {
    const hour = new Date(e.createdAt).getHours();
    skipHourCounts[hour] = (skipHourCounts[hour] || 0) + 1;
  }
  const sortedSkipHours = Object.entries(skipHourCounts)
    .map(([h, n]) => [Number(h), n] as const)
    .sort((a, b) => b[1] - a[1]);

  // Last 7 days activity
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const lastWeekCount = recent.filter(e => new Date(e.createdAt) >= weekAgo).length;

  const parts: string[] = [];
  parts.push(`BEHAVIORAL HISTORY (last ${HISTORY_DAYS} days, ${recent.length} task events):`);
  parts.push(`- Completion rate: ${completionRate}% (${completed.length} completed, ${skipped.length} skipped, out of ${outcomeTotal} outcome events)`);

  if (completedWithActual > 0) {
    const avgActual = Math.round(totalActualMin / completedWithActual);
    parts.push(`- Average actual effort on completed tasks: ~${avgActual} min (from ${completedWithActual} tasks that recorded it)`);
  }

  if (sortedSkipHours.length > 0) {
    const peak = sortedSkipHours[0];
    const peakPct = Math.round((peak[1] / skipped.length) * 100);
    const hourLabel = peak[0];
    const timeOfDay = hourLabel < 12 ? 'morning (before noon)' : hourLabel < 18 ? 'afternoon' : 'evening';
    parts.push(`- Skips cluster in the ${timeOfDay} (hour ${String(hourLabel).padStart(2, '0')}:00 — ${peakPct}% of all skips, ${peak[1]} skips)`);
    if (sortedSkipHours.length > 1) {
      const second = sortedSkipHours[1];
      const secondPct = Math.round((second[1] / skipped.length) * 100);
      parts.push(`- Secondary skip cluster: hour ${String(second[0]).padStart(2, '0')}:00 (${secondPct}%, ${second[1]} skips)`);
    }
  } else {
    parts.push('- No clear time-of-day skip pattern yet');
  }

  parts.push(`- Last 7 days: ${lastWeekCount} task events`);
  if (lastWeekCount > 0) {
    const weekOutcomes = recent.filter(e => new Date(e.createdAt) >= weekAgo && (e.type === 'COMPLETED' || e.type === 'SKIPPED')).length;
    if (weekOutcomes > 0) {
      const weekCompleted = recent.filter(e => new Date(e.createdAt) >= weekAgo && e.type === 'COMPLETED').length;
      const weekRate = Math.round((weekCompleted / weekOutcomes) * 100);
      parts.push(`- This week: ${weekOutcomes} outcomes, ${weekRate}% completed`);
    }
  }

  return parts.join('\n');
}
