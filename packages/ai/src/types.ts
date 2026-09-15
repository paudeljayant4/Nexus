import { z } from 'zod';

export const AIProviderSchema = z.enum(['openai', 'anthropic', 'google', 'local']);
export type AIProvider = z.infer<typeof AIProviderSchema>;

export const AIModelSchema = z.object({
  provider: AIProviderSchema,
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().optional(),
});

export type AIModel = z.infer<typeof AIModelSchema>;

export const AIRequestSchema = z.object({
  prompt: z.string(),
  model: AIModelSchema.optional(),
  systemPrompt: z.string().optional(),
  jsonMode: z.boolean().default(false),
});

export type AIRequest = z.infer<typeof AIRequestSchema>;

export const AIResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    promptTokens: z.number().int().nonnegative(),
    completionTokens: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
  }).optional(),
  model: z.string(),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

export interface AIProviderAdapter {
  generate(request: AIRequest): Promise<AIResponse>;
  embed(text: string): Promise<number[]>;
}