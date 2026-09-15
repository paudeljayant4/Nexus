'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';


interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  dueDate?: string;
  scheduledDate?: string;
  estimatedMinutes?: number;
  goalId?: string;
  completedAt?: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
}

interface Ranking {
  taskId: string;
  rank: number;
  reason?: string;
  confidence: number;
}

interface Habit {
  id: string;
  name: string;
  color: string;
  active: boolean;
}

interface HabitStats {
  currentStreak: number;
  totalCompletions: number;
  completionRate: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitStatsMap, setHabitStatsMap] = useState<Record<string, HabitStats>>({});
  const [loading, setLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const [tasksData, goalsData, habitsData] = await Promise.all([
        api.tasks.list(user!.id),
        api.goals.list(user!.id),
        api.habits.list(user!.id),
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setGoals(Array.isArray(goalsData) ? goalsData : []);

      const habitsArr = Array.isArray(habitsData) ? habitsData : [];
      setHabits(habitsArr);

      const statsMap: Record<string, HabitStats> = {};
      await Promise.all(
        habitsArr.slice(0, 10).map(async (h: Habit) => {
          try {
            const stats = await api.habits.stats(h.id);
            statsMap[h.id] = stats;
          } catch {}
        })
      );
      setHabitStatsMap(statsMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRank() {
    setRankingLoading(true);
    try {
      const data = await api.tasks.rank(user!.id);
      setRankings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setRankingLoading(false);
    }
  }

  async function handleStatusChange(taskId: string, status: string) {
    try {
      const updated = await api.tasks.updateStatus(taskId, status);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch (err) {
      console.error(err);
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const activeTasks = tasks.filter(t => t.status !== 'DONE' && t.status !== 'SKIPPED');
  const completedToday = tasks.filter(t => t.status === 'DONE' && t.completedAt?.startsWith(today)).length;
  const activeGoals = goals.filter(g => g.status === 'ACTIVE');
  const rankedMap = new Map(rankings.map(r => [r.taskId, r]));
  const rankedTasks = rankings
    .map(r => ({ task: tasks.find(t => t.id === r.taskId), ranking: r }))
    .filter((x): x is { task: Task; ranking: Ranking } => !!x.task);
  const unrankedTasks = activeTasks.filter(t => !rankedMap.has(t.id));
  const topHabits = habits.filter(h => h.active).slice(0, 5);

  const totalStreak = topHabits.reduce((sum, h) => {
    const s = habitStatsMap[h.id];
    return sum + (s?.currentStreak || 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const topRanked = rankedTasks[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name || 'there'}
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your overview for today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Tasks Completed Today</p>
          <p className="text-3xl font-bold mt-1">{completedToday}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Active Goals</p>
          <p className="text-3xl font-bold mt-1">{activeGoals.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total Habit Streaks</p>
          <p className="text-3xl font-bold mt-1">{totalStreak}</p>
        </div>
      </div>

      {topRanked && (
        <div className="bg-card border-2 border-primary rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-primary">#1</span>
                <span className="text-xs text-muted-foreground">NEXT</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{topRanked.task.title}</h2>
                {topRanked.ranking.reason && (
                  <p className="text-sm text-muted-foreground mt-1">{topRanked.ranking.reason}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span>Confidence: {Math.round(topRanked.ranking.confidence * 100)}%</span>
                  {topRanked.task.dueDate && (
                    <span>Due: {new Date(topRanked.task.dueDate).toLocaleDateString()}</span>
                  )}
                  {topRanked.task.estimatedMinutes && (
                    <span>~{topRanked.task.estimatedMinutes}m</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange(topRanked.task.id, 'IN_PROGRESS')}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Start
              </button>
              <button
                onClick={() => handleStatusChange(topRanked.task.id, 'DONE')}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-semibold">Active Tasks</h3>
            <button
              onClick={handleRank}
              disabled={rankingLoading}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {rankingLoading ? 'Ranking...' : 'Rank Tasks with AI'}
            </button>
          </div>
          <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
            {rankedTasks.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">AI Ranked</p>
                {rankedTasks.slice(0, 10).map(({ task, ranking }) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-primary w-6">#{ranking.rank}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {ranking.reason && (
                          <p className="text-xs text-muted-foreground truncate">{ranking.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground mr-2">P{task.priority}</span>
                      {task.status !== 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                          className="px-2 py-1 text-xs bg-secondary rounded hover:bg-secondary/80"
                        >
                          Start
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(task.id, 'DONE')}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {unrankedTasks.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                  {rankings.length > 0 ? 'Unranked' : 'All Tasks'}
                </p>
                {unrankedTasks.slice(0, 10).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>P{task.priority}</span>
                        {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {task.status !== 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                          className="px-2 py-1 text-xs bg-secondary rounded hover:bg-secondary/80"
                        >
                          Start
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(task.id, 'DONE')}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {activeTasks.length === 0 && (
              <p className="text-muted-foreground text-center py-8 text-sm">No active tasks.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold">Active Goals</h3>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-primary hover:underline"
              >
                View All
              </button>
            </div>
            <div className="p-5 space-y-3">
              {activeGoals.length === 0 && (
                <p className="text-muted-foreground text-center py-4 text-sm">No active goals.</p>
              )}
              {activeGoals.map(goal => {
                const goalTasks = tasks.filter(t => t.goalId === goal.id);
                const done = goalTasks.filter(t => t.status === 'DONE').length;
                const pct = goalTasks.length > 0 ? Math.round((done / goalTasks.length) * 100) : 0;
                return (
                  <div key={goal.id} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{goal.title}</p>
                      <span className="text-xs text-muted-foreground">P{goal.priority}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 mt-2">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{done}/{goalTasks.length} tasks ({pct}%)</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold">Habits</h3>
              <button
                onClick={() => router.push('/habits')}
                className="text-sm text-primary hover:underline"
              >
                View All
              </button>
            </div>
            <div className="p-5 space-y-2">
              {topHabits.length === 0 && (
                <p className="text-muted-foreground text-center py-4 text-sm">No habits tracked yet.</p>
              )}
              {topHabits.map(habit => {
                const stats = habitStatsMap[habit.id];
                return (
                  <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${habit.color}15` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                      <span className="text-sm font-medium">{habit.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: habit.color }}>
                        {stats?.currentStreak || 0} day streak
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats ? `${Math.round(stats.completionRate * 100)}% rate` : 'No data'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
