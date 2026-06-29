import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import * as api from '../api/organizations.api';
import {
  type CreateOrganizationInput,
  type InviteMemberInput,
} from '../schemas/organization.schema';

export const orgKeys = {
  all: ['organizations'] as const,
  mine: (ids: string[]) => [...orgKeys.all, 'mine', ids] as const,
  subscription: (orgId: string | null) => ['subscription', orgId] as const,
  members: (orgId: string | null) => ['members', orgId] as const,
  invitations: (orgId: string | null) => ['invitations', orgId] as const,
  invitation: (token: string) => ['invitation', token] as const,
};

export function useMyOrganizations() {
  const { claims } = useAuth();
  const ids = claims.orgIds;
  return useQuery({
    queryKey: orgKeys.mine(ids),
    queryFn: () => api.fetchOrganizations(ids),
    enabled: ids.length > 0,
  });
}

export function useActiveSubscription() {
  const { claims } = useAuth();
  const orgId = claims.organizationId;
  return useQuery({
    queryKey: orgKeys.subscription(orgId),
    queryFn: () => api.fetchActiveSubscription(orgId as string),
    enabled: Boolean(orgId),
  });
}

export function useMembers() {
  const { claims } = useAuth();
  const orgId = claims.organizationId;
  return useQuery({
    queryKey: orgKeys.members(orgId),
    queryFn: () => api.fetchMembers(orgId as string),
    enabled: Boolean(orgId),
  });
}

export function usePendingInvitations() {
  const { claims } = useAuth();
  const orgId = claims.organizationId;
  return useQuery({
    queryKey: orgKeys.invitations(orgId),
    queryFn: () => api.fetchPendingInvitations(orgId as string),
    enabled: Boolean(orgId),
  });
}

export function useInvitation(token: string) {
  return useQuery({
    queryKey: orgKeys.invitation(token),
    queryFn: () => api.getInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useCreateOrganization() {
  const { refresh } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => api.createOrganization(input),
    onSuccess: async () => {
      await refresh();
      await queryClient.invalidateQueries();
    },
  });
}

export function useSwitchOrganization() {
  const { refresh } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) => api.setActiveOrganization(organizationId),
    onSuccess: async () => {
      await refresh();
      await queryClient.invalidateQueries();
    },
  });
}

export function useInviteMember() {
  const { claims } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteMemberInput) => api.inviteMember(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: orgKeys.invitations(claims.organizationId),
      });
    },
  });
}

export function useAcceptInvitation() {
  const { refresh } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api.acceptInvitation(token),
    onSuccess: async () => {
      await refresh();
      await queryClient.invalidateQueries();
    },
  });
}
