import { z } from 'zod';

export const HabitFrequencySchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY']);
export type HabitFrequency = z.infer<typeof HabitFrequencySchema>;

export const HabitSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  frequency: HabitFrequencySchema.default('DAILY'),
  targetCount: z.number().int().positive().default(1),
  color: z.string().default('#10b981'),
  icon: z.string().optional(),
  active: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Habit = z.infer<typeof HabitSchema>;

export const CreateHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  frequency: HabitFrequencySchema.optional(),
  targetCount: z.number().int().positive().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});
export type CreateHabit = z.infer<typeof CreateHabitSchema>;

export const UpdateHabitSchema = CreateHabitSchema.partial();
export type UpdateHabit = z.infer<typeof UpdateHabitSchema>;

export const HabitLogSchema = z.object({
  id: z.string().uuid(),
  habitId: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string(),
  count: z.number().int().positive().default(1),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type HabitLog = z.infer<typeof HabitLogSchema>;

export const LogHabitSchema = z.object({
  date: z.string(),
  count: z.number().int().positive().optional(),
  notes: z.string().optional(),
});
export type LogHabit = z.infer<typeof LogHabitSchema>;

export const HabitStatsSchema = z.object({
  habitId: z.string().uuid(),
  currentStreak: z.number().int(),
  longestStreak: z.number().int(),
  totalCompletions: z.number().int(),
  completionRate: z.number().min(0).max(1),
  lastLoggedDate: z.string().optional(),
});
export type HabitStats = z.infer<typeof HabitStatsSchema>;
