import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
  passwordHash: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});
export type CreateUser = z.infer<typeof CreateUserSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type Login = z.infer<typeof LoginSchema>;

export const UserSchema2 = UserSchema.omit({ passwordHash: true });
export type SafeUser = z.infer<typeof UserSchema2>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type Session = z.infer<typeof SessionSchema>;

export const UserSettingSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  timezone: z.string().default('UTC'),
  weekStart: z.number().int().min(0).max(6).default(1),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  aiProvider: z.string().optional(),
  aiModel: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type UserSetting = z.infer<typeof UserSettingSchema>;

export const UpdateUserSettingSchema = UserSettingSchema.partial().omit({ id: true, userId: true, createdAt: true, updatedAt: true });
export type UpdateUserSetting = z.infer<typeof UpdateUserSettingSchema>;
