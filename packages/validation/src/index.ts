import { z } from 'zod';
import {
  CreateGoalSchema, UpdateGoalSchema,
  CreateTaskSchema, UpdateTaskSchema,
  CreateHabitSchema, UpdateHabitSchema, LogHabitSchema,
  CreateMemorySchema, UpdateMemorySchema,
  CreateTagSchema,
  CreateDailyPlanSchema, CreateTimeBlockSchema, UpdateTimeBlockSchema,
  CreateAgentSchema, UpdateAgentSchema,
  CreateUserSchema, LoginSchema,
  ReorderTaskSchema, CreateTaskCommentSchema,
  CreateKnowledgeNodeSchema, CreateKnowledgeEdgeSchema,
  SearchMemorySchema, AutoScheduleRequestSchema,
  UpdateUserSettingSchema,
} from '@nexus/types';

export const validators = {
  createUser: CreateUserSchema,
  login: LoginSchema,
  createGoal: CreateGoalSchema,
  updateGoal: UpdateGoalSchema,
  createTask: CreateTaskSchema,
  updateTask: UpdateTaskSchema,
  reorderTasks: ReorderTaskSchema,
  createTaskComment: CreateTaskCommentSchema,
  createTag: CreateTagSchema,
  createDailyPlan: CreateDailyPlanSchema,
  createTimeBlock: CreateTimeBlockSchema,
  updateTimeBlock: UpdateTimeBlockSchema,
  createHabit: CreateHabitSchema,
  updateHabit: UpdateHabitSchema,
  logHabit: LogHabitSchema,
  createMemory: CreateMemorySchema,
  updateMemory: UpdateMemorySchema,
  searchMemory: SearchMemorySchema,
  createKnowledgeNode: CreateKnowledgeNodeSchema,
  createKnowledgeEdge: CreateKnowledgeEdgeSchema,
  createAgent: CreateAgentSchema,
  updateAgent: UpdateAgentSchema,
  autoSchedule: AutoScheduleRequestSchema,
  updateUserSetting: UpdateUserSettingSchema,
};

export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.output<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
