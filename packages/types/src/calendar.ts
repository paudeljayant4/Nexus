import { z } from 'zod';

export const TimeBlockTypeSchema = z.enum(['TASK', 'BREAK', 'MEETING', 'FOCUS', 'PERSONAL', 'OTHER']);
export type TimeBlockType = z.infer<typeof TimeBlockTypeSchema>;

export const DailyPlanSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type DailyPlan = z.infer<typeof DailyPlanSchema>;

export const CreateDailyPlanSchema = z.object({
  date: z.string(),
  notes: z.string().optional(),
});
export type CreateDailyPlan = z.infer<typeof CreateDailyPlanSchema>;

export const TimeBlockSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  planId: z.string().uuid().nullable(),
  taskId: z.string().uuid().nullable(),
  title: z.string().min(1).max(200),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: TimeBlockTypeSchema.default('TASK'),
  color: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type TimeBlock = z.infer<typeof TimeBlockSchema>;

export const CreateTimeBlockSchema = z.object({
  planId: z.string().uuid().nullable().optional(),
  taskId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(200),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: TimeBlockTypeSchema.optional(),
  color: z.string().optional(),
});
export type CreateTimeBlock = z.infer<typeof CreateTimeBlockSchema>;

export const UpdateTimeBlockSchema = CreateTimeBlockSchema.partial();
export type UpdateTimeBlock = z.infer<typeof UpdateTimeBlockSchema>;
