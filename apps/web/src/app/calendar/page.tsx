'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';


interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  color?: string;
  taskId?: string;
}

interface Task {
  id: string;
  title: string;
  scheduledDate?: string;
  dueDate?: string;
  status: string;
  priority: number;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showTimeBlockModal, setShowTimeBlockModal] = useState(false);
  const [tbTitle, setTbTitle] = useState('');
  const [tbStartTime, setTbStartTime] = useState('09:00');
  const [tbEndTime, setTbEndTime] = useState('10:00');
  const [tbColor, setTbColor] = useState('#6366f1');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    if (user) loadData();
  }, [user, currentDate]);

  async function loadData() {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const [tasksData, blocksData] = await Promise.all([
        api.tasks.list(user!.id),
        api.timeblocks.list(user!.id, startDate, endDate).catch(() => []),
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setTimeBlocks(Array.isArray(blocksData) ? blocksData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTimeBlock() {
    if (!tbTitle.trim() || !selectedDay) return;
    const dateStr = selectedDay.toISOString().split('T')[0];
    try {
      const block = await api.timeblocks.create(user!.id, {
        title: tbTitle,
        startTime: `${dateStr}T${tbStartTime}:00`,
        endTime: `${dateStr}T${tbEndTime}:00`,
        color: tbColor,
      });
      setTimeBlocks(prev => [...prev, block]);
      setShowTimeBlockModal(false);
      setTbTitle('');
      setTbStartTime('09:00');
      setTbEndTime('10:00');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteTimeBlock(id: string) {
    try {
      await api.timeblocks.delete(id);
      setTimeBlocks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const todayStr = new Date().toISOString().split('T')[0];

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => {
      const d = t.scheduledDate || t.dueDate;
      if (d) {
        const key = d.split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks]);

  const blocksByDate = useMemo(() => {
    const map: Record<string, TimeBlock[]> = {};
    timeBlocks.forEach(b => {
      const key = b.startTime.split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [timeBlocks]);

  const selectedDayTasks = selectedDay ? (tasksByDate[selectedDay.toISOString().split('T')[0]] || []) : [];
  const selectedDayBlocks = selectedDay ? (blocksByDate[selectedDay.toISOString().split('T')[0]] || []) : [];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">Manage your schedule and time blocks.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
            className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            {viewMode === 'month' ? 'Week View' : 'Month View'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1))}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                &larr;
              </button>
              <h2 className="text-lg font-semibold">
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(year, month + 1))}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  &rarr;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7">
              {weekDays.map(d => (
                <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-border">
                  {d}
                </div>
              ))}
              {days.map((day, i) => {
                const dateStr = day.toISOString().split('T')[0];
                const isCurrentMonth = day.getMonth() === month;
                const isToday = dateStr === todayStr;
                const isSelected = selectedDay?.toISOString().split('T')[0] === dateStr;
                const dayTasks = tasksByDate[dateStr] || [];
                const dayBlocks = blocksByDate[dateStr] || [];

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[100px] p-2 border-b border-r border-border cursor-pointer transition-colors
                      ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
                      ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted/50'}
                    `}
                  >
                    <div className={`text-sm font-medium mb-1
                      ${isToday ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : ''}
                      ${!isCurrentMonth ? 'text-muted-foreground' : ''}
                    `}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayBlocks.slice(0, 2).map(block => (
                        <div
                          key={block.id}
                          className="text-[10px] px-1 py-0.5 rounded truncate text-white"
                          style={{ backgroundColor: block.color || '#6366f1' }}
                        >
                          {block.title}
                        </div>
                      ))}
                      {dayTasks.slice(0, 2).map(task => (
                        <div
                          key={task.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate
                            ${task.status === 'DONE' ? 'bg-green-100 text-green-700 line-through' :
                              task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'}
                          `}
                        >
                          {task.title}
                        </div>
                      ))}
                      {(dayBlocks.length + dayTasks.length) > 4 && (
                        <p className="text-[10px] text-muted-foreground">
                          +{(dayBlocks.length + dayTasks.length) - 4} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">
                {selectedDay ? selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a day'}
              </h3>
              {selectedDay && (
                <button
                  onClick={() => setShowTimeBlockModal(true)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
                >
                  + Time Block
                </button>
              )}
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {selectedDayBlocks.length === 0 && selectedDayTasks.length === 0 && (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  {selectedDay ? 'Nothing scheduled for this day.' : 'Click a day to see details.'}
                </p>
              )}
              {selectedDayBlocks.map(block => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                  style={{ borderLeftWidth: '4px', borderLeftColor: block.color || '#6366f1' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{block.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(block.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(block.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTimeBlock(block.id)}
                    className="text-destructive hover:text-destructive/80 text-xs p-1"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {selectedDayTasks.map(task => (
                <div key={task.id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{task.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full
                      ${task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'}
                    `}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Priority: {task.priority}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showTimeBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Time Block</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={tbTitle}
                  onChange={e => setTbTitle(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Meeting, Focus time, etc."
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={tbStartTime}
                    onChange={e => setTbStartTime(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={tbEndTime}
                    onChange={e => setTbEndTime(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex gap-2">
                  {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'].map(c => (
                    <button
                      key={c}
                      onClick={() => setTbColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${tbColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowTimeBlockModal(false)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTimeBlock}
                disabled={!tbTitle.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
