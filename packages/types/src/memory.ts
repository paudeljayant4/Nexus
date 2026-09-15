import { z } from 'zod';

export const MemoryTypeSchema = z.enum(['NOTE', 'JOURNAL', 'IDEA', 'BOOKMARK', 'SNIPPET']);
export type MemoryType = z.infer<typeof MemoryTypeSchema>;

export const MemorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string(),
  type: MemoryTypeSchema.default('NOTE'),
  tags: z.array(z.string()).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Memory = z.infer<typeof MemorySchema>;

export const CreateMemorySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: MemoryTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
});
export type CreateMemory = z.infer<typeof CreateMemorySchema>;

export const UpdateMemorySchema = CreateMemorySchema.partial();
export type UpdateMemory = z.infer<typeof UpdateMemorySchema>;

export const NodeTypeSchema = z.enum(['CONCEPT', 'PERSON', 'PROJECT', 'TAG', 'GOAL', 'MEMORY', 'RESOURCE']);
export type NodeType = z.infer<typeof NodeTypeSchema>;

export const KnowledgeNodeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  memoryId: z.string().uuid().nullable(),
  label: z.string().min(1).max(200),
  type: NodeTypeSchema.default('CONCEPT'),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
});
export type KnowledgeNode = z.infer<typeof KnowledgeNodeSchema>;

export const CreateKnowledgeNodeSchema = z.object({
  memoryId: z.string().uuid().nullable().optional(),
  label: z.string().min(1).max(200),
  type: NodeTypeSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateKnowledgeNode = z.infer<typeof CreateKnowledgeNodeSchema>;

export const KnowledgeEdgeSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  relation: z.string().min(1).max(100),
  weight: z.number().min(0).max(1).default(1),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
});
export type KnowledgeEdge = z.infer<typeof KnowledgeEdgeSchema>;

export const CreateKnowledgeEdgeSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  relation: z.string().min(1).max(100),
  weight: z.number().min(0).max(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateKnowledgeEdge = z.infer<typeof CreateKnowledgeEdgeSchema>;

export const KnowledgeGraphSchema = z.object({
  nodes: z.array(KnowledgeNodeSchema),
  edges: z.array(KnowledgeEdgeSchema),
});
export type KnowledgeGraph = z.infer<typeof KnowledgeGraphSchema>;

export const SearchMemorySchema = z.object({
  query: z.string().min(1),
  type: MemoryTypeSchema.optional(),
  limit: z.number().int().positive().max(50).optional(),
});
export type SearchMemory = z.infer<typeof SearchMemorySchema>;
