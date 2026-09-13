import { z } from 'zod';

const strongPassword = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[0-9]/, 'Add a number')
  .regex(/[^A-Za-z0-9]/, 'Add a symbol');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().transform((value) => value.toLowerCase()),
  password: strongPassword,
});
export const loginSchema = z.object({ email: z.email(), password: z.string().min(1).max(128) });
export const forgotPasswordSchema = z.object({ email: z.email() });
export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: strongPassword,
});
export const verifyEmailSchema = z.object({ token: z.string().min(32) });
export const revokeSessionSchema = z.object({ sessionId: z.string().min(1) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
