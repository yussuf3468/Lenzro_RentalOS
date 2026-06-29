import { useMutation } from '@tanstack/react-query';
import {
  requestPasswordReset,
  resendVerification,
  signInWithPassword,
  signUp,
  updatePassword,
} from '../api/auth.api';
import { type SignInInput, type SignUpInput } from '../schemas/auth.schema';

export function useSignIn() {
  return useMutation({ mutationFn: (input: SignInInput) => signInWithPassword(input) });
}

export function useSignUp() {
  return useMutation({ mutationFn: (input: SignUpInput) => signUp(input) });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: (email: string) => requestPasswordReset(email) });
}

export function useUpdatePassword() {
  return useMutation({ mutationFn: (password: string) => updatePassword(password) });
}

export function useResendVerification() {
  return useMutation({ mutationFn: (email: string) => resendVerification(email) });
}
