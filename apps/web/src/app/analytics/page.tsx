'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';


interface ProductivityStats {
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionRate: number;
  avgEstimatedMinutes?: number;
  avgActualMinutes?: number;
  tasksByDay: Array<{ date: string; completed: number; created: number }>;
  tasksByPriority: Array<{ priority: number; count: number }>;
  topGoalProgress: Array<{ goalId: string; title: string; progress: number; totalTasks: number; completedTasks: number }>;
}

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  tasksCompleted: number;
  tasksCreated: number;
  goalsProgress: Array<{ title: string; progress: number }>;
  habitsCompleted: number;
  habitsRate: number;
  insights: string[];
  productivityScore: number;
}

interface Insight {
  id: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const [statsData, weeklyData, insightsData] = await Promise.all([
        api.analytics.get(user!.id),
        api.analytics.weekly(user!.id).catch(() => null),
        api.insights.list(user!.id).catch(() => []),
      ]);
      setStats(statsData);
      setWeekly(weeklyData);
      setInsights(Array.isArray(insightsData) ? insightsData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const maxCompleted = stats ? Math.max(...stats.tasksByDay.map(d => d.completed), 1) : 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your productivity and progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Completion Rate</p>
          <p className="text-3xl font-bold mt-1 text-primary">
            {stats ? `${Math.round(stats.completionRate * 100)}%` : '0%'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Tasks Done</p>
          <p className="text-3xl font-bold mt-1">{stats?.completedTasks || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-3xl font-bold mt-1 text-blue-500">{stats?.inProgressTasks || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-3xl font-bold mt-1 text-yellow-500">{stats?.pendingTasks || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Tasks Completed (Last 30 Days)</h3>
          </div>
          <div className="p-4">
            {stats && stats.tasksByDay.length > 0 ? (
              <div className="flex items-end gap-1 h-48">
                {stats.tasksByDay.map((day, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap">
                      {day.date}: {day.completed} completed, {day.created} created
                    </div>
                    <div
                      className="w-full bg-primary/20 rounded-t"
                      style={{ height: `${(day.completed / maxCompleted) * 100}%`, minHeight: day.completed > 0 ? '4px' : '0' }}
                    >
                      <div
                        className="w-full bg-primary rounded-t transition-all"
                        style={{ height: '100%' }}
                      />
                    </div>
                    {(i % 5 === 0 || i === stats.tasksByDay.length - 1) && (
                      <span className="text-[9px] text-muted-foreground mt-1">
                        {day.date.slice(5)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No task data yet.
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">By Priority</h3>
          </div>
          <div className="p-4 space-y-3">
            {stats && stats.tasksByPriority.length > 0 ? (
              stats.tasksByPriority.sort((a, b) => b.priority - a.priority).map(item => {
                const maxCount = Math.max(...stats.tasksByPriority.map(p => p.count), 1);
                const pct = (item.count / maxCount) * 100;
                const hue = (item.priority / 10) * 120;
                return (
                  <div key={item.priority}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Priority {item.priority}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: `hsl(${hue}, 70%, 50%)` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm">No data.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Goal Progress</h3>
          </div>
          <div className="p-4 space-y-4">
            {stats && stats.topGoalProgress.length > 0 ? (
              stats.topGoalProgress.map(goal => (
                <div key={goal.goalId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{goal.title}</span>
                    <span className="text-muted-foreground">{goal.completedTasks}/{goal.totalTasks}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className="h-3 bg-primary rounded-full transition-all"
                      style={{ width: `${Math.round(goal.progress * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm">No goals to track.</p>
            )}
          </div>
        </div>

        {weekly && (
          <div className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Weekly Report</h3>
              <p className="text-xs text-muted-foreground">{weekly.weekStart} to {weekly.weekEnd}</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{weekly.tasksCompleted}</p>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{weekly.productivityScore}</p>
                  <p className="text-xs text-muted-foreground">Productivity Score</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{weekly.habitsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Habits Logged</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{Math.round(weekly.habitsRate * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Habit Rate</p>
                </div>
              </div>
              {weekly.insights.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Insights</p>
                  {weekly.insights.map((insight, i) => (
                    <div key={i} className="text-sm p-2 bg-primary/5 border border-primary/20 rounded-lg mb-1">
                      {insight}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Insights Feed</h3>
        </div>
        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
          {insights.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">No insights yet. Keep using NEXUS to generate insights.</p>
          ) : (
            insights.map(insight => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border transition-colors ${insight.read ? 'border-border bg-muted/20' : 'border-primary/30 bg-primary/5'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                      {insight.type.replace('_', ' ')}
                    </span>
                    <h4 className="text-sm font-medium">{insight.title}</h4>
                  </div>
                  {!insight.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{insight.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(insight.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
