import { env } from '@/config/env';
import { getSupabaseClient } from '@/lib/supabase/client';
import { type SignInInput, type SignUpInput } from '../schemas/auth.schema';

export async function signUp({ fullName, email, password }: SignUpInput) {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${env.appUrl}/verify-email`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithPassword({ email, password }: SignInInput) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${env.appUrl}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await getSupabaseClient().auth.updateUser({ password });
  if (error) throw error;
}

export async function resendVerification(email: string) {
  const { error } = await getSupabaseClient().auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${env.appUrl}/verify-email` },
  });
  if (error) throw error;
}
