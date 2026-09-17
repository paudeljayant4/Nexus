import { z } from 'zod';
import { MetadataSchema } from './common';

export const TaskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  goalId: z.string().uuid().nullable(),
  parentId: z.string().uuid().nullable(),
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  status: TaskStatusSchema.default('PENDING'),
  priority: z.number().int().min(1).max(10).default(5),
  dueDate: z.string().datetime().optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  actualMinutes: z.number().int().positive().optional(),
  sortOrder: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  metadata: MetadataSchema.optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = z.object({
  userId: z.string().uuid(),
  goalId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  status: TaskStatusSchema.optional(),
  priority: z.number().int().min(1).max(10).optional(),
  dueDate: z.string().datetime().optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  sortOrder: z.number().int().optional(),
  metadata: MetadataSchema.partial().optional(),
});
export type CreateTask = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  goalId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional(),
  status: TaskStatusSchema.optional(),
  priority: z.number().int().min(1).max(10).optional(),
  dueDate: z.string().datetime().optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  actualMinutes: z.number().int().positive().optional(),
  sortOrder: z.number().int().optional(),
});
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;

export const TaskRankingSchema = z.object({
  taskId: z.string().uuid(),
  rank: z.number().int().positive(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});
export type TaskRanking = z.infer<typeof TaskRankingSchema>;

export const RankedTaskSchema = z.object({
  task: TaskSchema,
  ranking: TaskRankingSchema,
});
export type RankedTask = z.infer<typeof RankedTaskSchema>;

export const TaskCommentSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TaskComment = z.infer<typeof TaskCommentSchema>;

export const CreateTaskCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});
export type CreateTaskComment = z.infer<typeof CreateTaskCommentSchema>;

export const TagSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().default('#6366f1'),
});
export type Tag = z.infer<typeof TagSchema>;

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().optional(),
});
export type CreateTag = z.infer<typeof CreateTagSchema>;

export const ReorderTaskSchema = z.object({
  taskIds: z.array(z.string().uuid()),
});
export type ReorderTask = z.infer<typeof ReorderTaskSchema>;
