'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';


interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  targetCount: number;
  color: string;
  icon?: string;
  active: boolean;
  createdAt: string;
}

interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  lastLoggedDate?: string;
}

export default function HabitsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, HabitStats>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formFreq, setFormFreq] = useState('DAILY');
  const [formTarget, setFormTarget] = useState('1');
  const [formColor, setFormColor] = useState('#10b981');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logCount, setLogCount] = useState('1');

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const data = await api.habits.list(user!.id);
      const arr = Array.isArray(data) ? data : [];
      setHabits(arr);

      const sm: Record<string, HabitStats> = {};
      await Promise.all(
        arr.map(async (h: Habit) => {
          try {
            const stats = await api.habits.stats(h.id);
            sm[h.id] = stats;
          } catch {}
        })
      );
      setStatsMap(sm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateHabit() {
    if (!formName.trim()) return;
    try {
      const habit = await api.habits.create(user!.id, {
        name: formName,
        description: formDesc || undefined,
        frequency: formFreq,
        targetCount: parseInt(formTarget) || 1,
        color: formColor,
      });
      setHabits(prev => [...prev, habit]);
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteHabit(id: string) {
    try {
      await api.habits.delete(id);
      setHabits(prev => prev.filter(h => h.id !== id));
      if (selectedHabit?.id === id) {
        setShowDetailModal(false);
        setSelectedHabit(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLogCompletion(habitId: string) {
    try {
      await api.habits.log(habitId, { date: logDate, count: parseInt(logCount) || 1 });
      const stats = await api.habits.stats(habitId);
      setStatsMap(prev => ({ ...prev, [habitId]: stats }));
    } catch (err) {
      console.error(err);
    }
  }

  function resetForm() {
    setFormName('');
    setFormDesc('');
    setFormFreq('DAILY');
    setFormTarget('1');
    setFormColor('#10b981');
  }

  function openDetail(habit: Habit) {
    setSelectedHabit(habit);
    setLogDate(new Date().toISOString().split('T')[0]);
    setLogCount('1');
    setShowDetailModal(true);
  }

  const activeHabits = habits.filter(h => h.active);
  const archivedHabits = habits.filter(h => !h.active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
          <p className="text-muted-foreground mt-1">Track your daily habits and build consistency.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + Add Habit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeHabits.length === 0 && (
          <div className="col-span-full bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No habits yet. Start building consistency today!</p>
          </div>
        )}
        {activeHabits.map(habit => {
          const stats = statsMap[habit.id];
          return (
            <div
              key={habit.id}
              className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openDetail(habit)}
              style={{ borderTopWidth: '3px', borderTopColor: habit.color }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{habit.name}</h3>
                  {habit.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{habit.description}</p>
                  )}
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                >
                  {habit.frequency}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold" style={{ color: habit.color }}>
                    {stats?.currentStreak || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats ? `${Math.round(stats.completionRate * 100)}%` : '0%'}
                  </p>
                  <p className="text-xs text-muted-foreground">Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats?.totalCompletions || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
              {stats?.lastLoggedDate && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Last logged: {new Date(stats.lastLoggedDate).toLocaleDateString()}
                </p>
              )}
              <button
                onClick={e => { e.stopPropagation(); handleLogCompletion(habit.id); }}
                className="w-full mt-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
              >
                Log Today
              </button>
            </div>
          );
        })}
      </div>

      {archivedHabits.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Archived</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedHabits.map(habit => {
              const stats = statsMap[habit.id];
              return (
                <div key={habit.id} className="bg-card border border-border rounded-xl p-5 opacity-60">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{habit.name}</h3>
                    <span className="text-xs text-muted-foreground">{habit.frequency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Best streak: {stats?.longestStreak || 0} days
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Habit</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Read 30 minutes"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select
                    value={formFreq}
                    onChange={e => setFormFreq(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formTarget}
                    onChange={e => setFormTarget(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex gap-2">
                  {['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map(c => (
                    <button
                      key={c}
                      onClick={() => setFormColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${formColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHabit}
                disabled={!formName.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedHabit.color }} />
                <h3 className="text-lg font-semibold">{selectedHabit.name}</h3>
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedHabit(null); }}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                &times;
              </button>
            </div>
            {selectedHabit.description && (
              <p className="text-sm text-muted-foreground mb-4">{selectedHabit.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold" style={{ color: selectedHabit.color }}>
                  {statsMap[selectedHabit.id]?.currentStreak || 0}
                </p>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">{statsMap[selectedHabit.id]?.longestStreak || 0}</p>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">
                  {statsMap[selectedHabit.id] ? `${Math.round(statsMap[selectedHabit.id]!.completionRate * 100)}%` : '0%'}
                </p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">{statsMap[selectedHabit.id]?.totalCompletions || 0}</p>
                <p className="text-sm text-muted-foreground">Total Completions</p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h4 className="font-medium mb-3">Log Completion</h4>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-muted-foreground mb-1">Count</label>
                  <input
                    type="number"
                    min="1"
                    value={logCount}
                    onChange={e => setLogCount(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  />
                </div>
                <button
                  onClick={() => handleLogCompletion(selectedHabit.id)}
                  className="px-4 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
                >
                  Log
                </button>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => handleDeleteHabit(selectedHabit.id)}
                className="px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                Delete Habit
              </button>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedHabit(null); }}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
