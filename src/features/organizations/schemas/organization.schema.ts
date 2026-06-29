import { z } from 'zod';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Enter your company name'),
  country: z.string().length(2),
  currency: z.string().length(3),
  timezone: z.string().min(1),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().min(1, 'Email is required').regex(EMAIL_RE, 'Enter a valid email'),
  role: z.string().min(1, 'Choose a role'),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
