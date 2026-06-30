/** Map raw Supabase / RPC errors to friendly, human messages. */
const MESSAGE_MAP: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password.',
  'Email not confirmed': 'Please verify your email before signing in.',
  'User already registered': 'An account with this email already exists.',
  'Password should be at least': 'Your password is too short.',
  over_email_send_rate_limit: 'Too many attempts. Please wait a moment and try again.',
  LNZ_NOT_AUTHENTICATED: 'Please sign in to continue.',
  LNZ_EMAIL_MISMATCH: 'This invitation was sent to a different email address.',
  LNZ_INVALID_INVITATION: 'This invitation is invalid or has expired.',
  LNZ_INVALID_NAME: 'Please enter a valid name.',
  LNZ_NOT_A_MEMBER: "You're not a member of that organization.",
  LNZ_NO_ACTIVE_ORG: 'No active organization selected.',
  LNZ_FORBIDDEN: "You don't have permission to do that.",
  LNZ_INVALID_ROLE: 'That role is not valid.',
  LNZ_LAST_OWNER: 'An organization must always have at least one owner.',
  LNZ_CANNOT_REMOVE_SELF: "You can't remove yourself.",
};

export function toMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!error) return fallback;
  const raw = typeof error === 'string' ? error : ((error as { message?: string }).message ?? '');
  if (!raw) return fallback;
  for (const [needle, friendly] of Object.entries(MESSAGE_MAP)) {
    if (raw.includes(needle)) return friendly;
  }
  return raw;
}
