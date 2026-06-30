import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  invitationPreviewSchema,
  invitationSchema,
  memberWithProfileSchema,
  organizationSchema,
  subscriptionSchema,
  type Invitation,
  type InvitationPreview,
  type MemberWithProfile,
  type Organization,
  type Subscription,
} from '@/types/domain';
import {
  type CreateOrganizationInput,
  type InviteMemberInput,
} from '../schemas/organization.schema';

const ORG_COLUMNS =
  'id,slug,name,legal_name,country,default_currency,timezone,logo_path,status,created_at';

export async function fetchOrganizations(ids: string[]): Promise<Organization[]> {
  if (ids.length === 0) return [];
  const { data, error } = await getSupabaseClient()
    .from('organizations')
    .select(ORG_COLUMNS)
    .in('id', ids);
  if (error) throw error;
  return z.array(organizationSchema).parse(data);
}

export async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  const { data, error } = await getSupabaseClient().rpc('create_organization', {
    p_name: input.name,
    p_country: input.country,
    p_currency: input.currency,
    p_timezone: input.timezone,
  });
  if (error) throw error;
  return organizationSchema.parse(data);
}

export async function setActiveOrganization(organizationId: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('set_active_organization', {
    p_org: organizationId,
  });
  if (error) throw error;
}

export async function fetchActiveSubscription(
  organizationId: string,
): Promise<Subscription | null> {
  const { data, error } = await getSupabaseClient()
    .from('subscriptions')
    .select('id,organization_id,plan_key,status,trial_end,current_period_end,grace_until')
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (error) throw error;
  return data ? subscriptionSchema.parse(data) : null;
}

export async function fetchMembers(organizationId: string): Promise<MemberWithProfile[]> {
  const { data, error } = await getSupabaseClient()
    .from('memberships')
    .select('id,organization_id,user_id,role,status,created_at,profiles(id,full_name,avatar_path)')
    .eq('organization_id', organizationId)
    .order('created_at');
  if (error) throw error;
  return z.array(memberWithProfileSchema).parse(data);
}

export async function fetchPendingInvitations(organizationId: string): Promise<Invitation[]> {
  const { data, error } = await getSupabaseClient()
    .from('invitations')
    .select('id,email,role,status,expires_at,created_at')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return z.array(invitationSchema).parse(data);
}

export interface InviteResult {
  invitation_id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
}

export async function inviteMember(input: InviteMemberInput): Promise<InviteResult> {
  const { data, error } = await getSupabaseClient().rpc('invite_member', {
    p_email: input.email,
    p_role: input.role,
  });
  if (error) throw error;
  return data as InviteResult;
}

export async function getInvitation(token: string): Promise<InvitationPreview | null> {
  const { data, error } = await getSupabaseClient().rpc('get_invitation', { p_token: token });
  if (error) throw error;
  return data ? invitationPreviewSchema.parse(data) : null;
}

export async function acceptInvitation(token: string): Promise<Organization> {
  const { data, error } = await getSupabaseClient().rpc('accept_invitation', { p_token: token });
  if (error) throw error;
  return organizationSchema.parse(data);
}

export async function updateMemberRole(userId: string, role: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('update_member_role', {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
}

export async function removeMember(userId: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('remove_member', { p_user_id: userId });
  if (error) throw error;
}
