import { z } from 'zod';
import { MetadataSchema } from './common';

export const GoalStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']);
export type GoalStatus = z.infer<typeof GoalStatusSchema>;

export const GoalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: GoalStatusSchema.default('ACTIVE'),
  priority: z.number().int().min(1).max(10).default(5),
  targetDate: z.string().datetime().optional(),
  metadata: MetadataSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Goal = z.infer<typeof GoalSchema>;

// CreateGoalSchema - status and priority are required with defaults applied at API level
export const CreateGoalSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: GoalStatusSchema,
  priority: z.number().int().min(1).max(10),
  targetDate: z.string().datetime().optional(),
  metadata: MetadataSchema.optional(),
});
export type CreateGoal = z.infer<typeof CreateGoalSchema>;

export const UpdateGoalSchema = z.object({
  userId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: GoalStatusSchema.optional(),
  priority: z.number().int().min(1).max(10).optional(),
  targetDate: z.string().datetime().optional(),
});
export type UpdateGoal = z.infer<typeof UpdateGoalSchema>;