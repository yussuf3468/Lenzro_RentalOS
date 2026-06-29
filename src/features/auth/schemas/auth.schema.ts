import { z } from 'zod';

// Version-proof email validation (avoids zod 3/4 string-format API differences).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const email = z.string().min(1, 'Email is required').regex(EMAIL_RE, 'Enter a valid email');

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email,
  password: z.string().min(8, 'Use at least 8 characters'),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
