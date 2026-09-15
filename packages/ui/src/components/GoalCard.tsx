'use client';

import { Goal } from '@nexus/types';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { cn, formatRelativeTime } from '../utils';

interface GoalCardProps {
  goal: Goal;
  taskCount: number;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export function GoalCard({ goal, taskCount, onEdit, onDelete }: GoalCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{goal.title}</CardTitle>
            {goal.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(goal)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(goal.id)} className="text-red-500">
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Priority: {goal.priority}
            </span>
          </span>
          <span className="flex items-center gap-1">
            📋 {taskCount} tasks
          </span>
          {goal.targetDate && (
            <span className="flex items-center gap-1">
              🎯 {formatRelativeTime(goal.targetDate)}
            </span>
          )}
          <span className={cn('px-2 py-0.5 rounded-full text-xs', 
            goal.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            goal.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          )}>
            {goal.status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}