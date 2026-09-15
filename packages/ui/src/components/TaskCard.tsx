'use client';

import { Task, TaskStatus } from '@nexus/types';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { cn, formatRelativeTime } from '../utils';

interface TaskCardProps {
  task: Task;
  rank?: number;
  reason?: string;
  confidence?: number;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

const statusStyles: Record<TaskStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SKIPPED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const statusLabels: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  SKIPPED: 'Skipped',
};

export function TaskCard({ task, rank, reason, confidence, onStatusChange, onDelete }: TaskCardProps) {
  const handleStatusChange = (status: TaskStatus) => onStatusChange(task.id, status);

  return (
    <Card className={cn('relative overflow-hidden', rank === 1 && 'ring-2 ring-blue-500')}>
      {rank === 1 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
      )}
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-2 mt-1">
            {rank && (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">#{rank}</span>
            )}
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className={cn('text-xs rounded border px-2 py-0.5', statusStyles[task.status])}
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="SKIPPED">Skipped</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  📅 {formatRelativeTime(task.dueDate)}
                </span>
              )}
              {task.estimatedMinutes && (
                <span>⏱ {task.estimatedMinutes}min</span>
              )}
              <span className={cn('px-2 py-0.5 rounded-full text-xs', statusStyles[task.status])}>
                {statusLabels[task.status]}
              </span>
            </div>
            
            {(reason || confidence !== undefined) && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-300">
                {reason && <p className="font-medium">{reason}</p>}
                {confidence !== undefined && (
                  <p>Confidence: {Math.round(confidence * 100)}%</p>
                )}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id)}
            className="text-gray-400 hover:text-red-500"
          >
            ✕
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}