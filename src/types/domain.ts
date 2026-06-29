import { z } from 'zod';

/**
 * Domain row schemas — the source of truth for shapes read from Supabase.
 * Responses are parsed with these at the data-access boundary (robust even
 * before generated DB types exist).
 */

export const organizationSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  legal_name: z.string().nullable(),
  country: z.string(),
  default_currency: z.string(),
  timezone: z.string(),
  logo_path: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
});
export type Organization = z.infer<typeof organizationSchema>;

export const profileSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  avatar_path: z.string().nullable(),
  active_organization_id: z.string().nullable(),
  locale: z.string(),
});
export type Profile = z.infer<typeof profileSchema>;

export const membershipSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  user_id: z.string(),
  role: z.string(),
  status: z.string(),
  created_at: z.string(),
});
export type Membership = z.infer<typeof membershipSchema>;

export const memberWithProfileSchema = membershipSchema.extend({
  profiles: profileSchema.pick({ id: true, full_name: true, avatar_path: true }).nullable(),
});
export type MemberWithProfile = z.infer<typeof memberWithProfileSchema>;

export const subscriptionStatus = z.enum([
  'trialing',
  'active',
  'past_due',
  'grace',
  'canceled',
  'expired',
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatus>;

export const subscriptionSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  plan_key: z.string(),
  status: subscriptionStatus,
  trial_end: z.string().nullable(),
  current_period_end: z.string().nullable(),
  grace_until: z.string().nullable(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const planEntitlementSchema = z.object({
  plan_key: z.string(),
  feature_key: z.string(),
  enabled: z.boolean(),
  limit_value: z.number().nullable(),
});
export type PlanEntitlement = z.infer<typeof planEntitlementSchema>;

export const invitationPreviewSchema = z.object({
  email: z.string(),
  role: z.string(),
  organization_name: z.string(),
  organization_slug: z.string(),
  expires_at: z.string(),
  valid: z.boolean(),
});
export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;

export const invitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string(),
  status: z.string(),
  expires_at: z.string(),
  created_at: z.string(),
});
export type Invitation = z.infer<typeof invitationSchema>;
