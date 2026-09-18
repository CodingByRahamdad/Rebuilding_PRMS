import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address format'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z
      .string()
      .min(1, 'Current password is required')
      .min(6, 'Password must be at least 6 characters'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(6, 'New password must be at least 6 characters'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address format'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address format'),
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(6, 'New password must be at least 6 characters'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];

