import { z } from 'zod';

export const InsightTypeSchema = z.enum([
  'PRODUCTIVITY',
  'HABIT_STREAK',
  'GOAL_PROGRESS',
  'SCHEDULE_OPTIMIZATION',
  'WEEKLY_SUMMARY',
  'AI_SUGGESTION',
]);
export type InsightType = z.infer<typeof InsightTypeSchema>;

export const InsightSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: InsightTypeSchema,
  title: z.string().min(1).max(200),
  content: z.string(),
  data: z.record(z.unknown()).nullable(),
  priority: z.number().int().min(1).max(10).default(5),
  read: z.boolean().default(false),
  createdAt: z.string().datetime(),
});
export type Insight = z.infer<typeof InsightSchema>;

export const ProductivityStatsSchema = z.object({
  totalTasks: z.number().int(),
  completedTasks: z.number().int(),
  skippedTasks: z.number().int(),
  inProgressTasks: z.number().int(),
  pendingTasks: z.number().int(),
  completionRate: z.number().min(0).max(1),
  avgEstimatedMinutes: z.number().nullable(),
  avgActualMinutes: z.number().nullable(),
  tasksByDay: z.array(z.object({
    date: z.string(),
    completed: z.number().int(),
    created: z.number().int(),
  })),
  tasksByPriority: z.array(z.object({
    priority: z.number().int(),
    count: z.number().int(),
  })),
  topGoalProgress: z.array(z.object({
    goalId: z.string().uuid(),
    title: z.string(),
    progress: z.number().min(0).max(1),
    totalTasks: z.number().int(),
    completedTasks: z.number().int(),
  })),
});
export type ProductivityStats = z.infer<typeof ProductivityStatsSchema>;

export const WeeklyReportSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  tasksCompleted: z.number().int(),
  tasksCreated: z.number().int(),
  goalsProgress: z.array(z.object({
    title: z.string(),
    progress: z.number().min(0).max(1),
  })),
  habitsCompleted: z.number().int(),
  habitsRate: z.number().min(0).max(1),
  insights: z.array(z.string()),
  productivityScore: z.number().min(0).max(100),
});
export type WeeklyReport = z.infer<typeof WeeklyReportSchema>;
