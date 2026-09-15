import { z } from 'zod';

export const AgentTypeSchema = z.enum(['ASSISTANT', 'SCHEDULER', 'ANALYZER', 'SUGGESTER']);
export type AgentType = z.infer<typeof AgentTypeSchema>;

export const AgentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: AgentTypeSchema.default('ASSISTANT'),
  config: z.record(z.unknown()).nullable(),
  active: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: AgentTypeSchema.optional(),
  config: z.record(z.unknown()).optional(),
});
export type CreateAgent = z.infer<typeof CreateAgentSchema>;

export const UpdateAgentSchema = CreateAgentSchema.partial();
export type UpdateAgent = z.infer<typeof UpdateAgentSchema>;

export const RunStatusSchema = z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const AgentRunSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  userId: z.string().uuid(),
  status: RunStatusSchema.default('PENDING'),
  input: z.record(z.unknown()).nullable(),
  output: z.record(z.unknown()).nullable(),
  error: z.string().nullable(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type AgentRun = z.infer<typeof AgentRunSchema>;

export const DailyBriefingSchema = z.object({
  date: z.string(),
  topPriorities: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    reason: z.string(),
  })),
  habitReminder: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    streak: z.number().int(),
  })),
  goalProgress: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    progress: z.number().min(0).max(1),
    taskCount: z.number().int(),
    completedCount: z.number().int(),
  })),
  suggestions: z.array(z.string()),
});
export type DailyBriefing = z.infer<typeof DailyBriefingSchema>;

export const AutoScheduleRequestSchema = z.object({
  date: z.string(),
  availableHours: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  focusMode: z.boolean().optional(),
});
export type AutoScheduleRequest = z.infer<typeof AutoScheduleRequestSchema>;
