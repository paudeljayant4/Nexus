import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.nullable(),
    error: ApiErrorSchema.nullable(),
  });

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};

export const SourceSchema = z.enum(['user', 'ai_inferred', 'ai_suggested', 'imported', 'system']);
export type Source = z.infer<typeof SourceSchema>;

export const ConfidenceSchema = z.number().min(0).max(1);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const MetadataSchema = z.object({
  source: SourceSchema.default('user'),
  confidence: ConfidenceSchema.default(1),
  importance: z.number().min(1).max(10).default(5),
  tags: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
});

export type Metadata = z.infer<typeof MetadataSchema>;

export type TaskEventType = 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'COMPLETED' | 'SKIPPED' | 'RANKED' | 'AI_SUGGESTED';

export interface TaskEvent {
  id: string;
  taskId: string;
  userId: string;
  type: TaskEventType;
  metadata?: Record<string, unknown>;
  createdAt: string;
}