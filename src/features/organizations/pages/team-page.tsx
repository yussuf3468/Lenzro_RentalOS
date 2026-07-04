import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Mail, Trash2, UserPlus, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form/form-field';
import { FormSelect } from '@/components/form/form-select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { env } from '@/config/env';
import { useAuth } from '@/features/auth';
import { toMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { cn, getInitials } from '@/lib/utils';
import { type MemberWithProfile } from '@/types/domain';
import { type InviteResult } from '../api/organizations.api';
import {
  useInviteMember,
  useMembers,
  usePendingInvitations,
  useRemoveMember,
  useUpdateMemberRole,
} from '../hooks/use-organizations';
import { ASSIGNABLE_ROLES, MANAGEABLE_ROLES, roleLabel } from '../lib/roles';
import { inviteMemberSchema, type InviteMemberInput } from '../schemas/organization.schema';

export function TeamPage() {
  const { claims, user } = useAuth();
  const members = useMembers();
  const invitations = usePendingInvitations();
  const invite = useInviteMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: '', role: 'receptionist' },
  });

  const onInvite = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await invite.mutateAsync(values);
      setInviteResult(result);
      reset({ email: '', role: values.role });
    } catch (error) {
      setFormError(toMessage(error));
    }
  });

  const inviteLink = inviteResult ? `${env.appUrl}/accept-invite?token=${inviteResult.token}` : '';
  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied');
  };

  const canInvite = claims.role === 'owner' || claims.role === 'manager';
  const canManageRoles = claims.role === 'owner';

  const changeRole = (member: MemberWithProfile, role: string) => {
    updateRole.mutate(
      { userId: member.user_id, role },
      {
        onSuccess: () => toast.success('Role updated'),
        onError: (error) => toast.error(toMessage(error)),
      },
    );
  };

  const remove = (member: MemberWithProfile) => {
    const name = member.profiles?.full_name ?? 'this member';
    if (!window.confirm(`Remove ${name} from the organization?`)) return;
    removeMember.mutate(member.user_id, {
      onSuccess: () => toast.success('Member removed'),
      onError: (error) => toast.error(toMessage(error)),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
        <p className="text-muted-foreground">
          Invite staff, assign roles, and manage who has access.
        </p>
      </div>

      {/* Desktop: invite + pending as a left rail, members fill the right. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] lg:items-start">
        {canInvite ? (
          <Card>
            <CardHeader>
              <CardTitle>Invite a teammate</CardTitle>
              <CardDescription>
                They'll join with the role you choose and get their own login.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={onInvite}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
                noValidate
              >
                <FormField
                  label="Email"
                  htmlFor="invite-email"
                  className="flex-1"
                  error={errors.email?.message}
                >
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="teammate@company.com"
                    aria-invalid={Boolean(errors.email)}
                    {...register('email')}
                  />
                </FormField>
                <FormField
                  label="Role"
                  htmlFor="invite-role"
                  className="sm:w-44"
                  error={errors.role?.message}
                >
                  <FormSelect
                    control={control}
                    name="role"
                    id="invite-role"
                    options={ASSIGNABLE_ROLES.map((role) => ({
                      value: role,
                      label: roleLabel(role),
                    }))}
                  />
                </FormField>
                <Button type="submit" disabled={invite.isPending}>
                  <UserPlus />
                  {invite.isPending ? 'Inviting…' : 'Invite'}
                </Button>
              </form>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
              {inviteResult ? (
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-sm font-medium">Invitation ready for {inviteResult.email}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Automated email arrives when a provider is connected. For now, share this secure
                    link:
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      readOnly
                      value={inviteLink}
                      className="font-mono text-xs"
                      onFocus={(event) => event.currentTarget.select()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyLink}
                      aria-label="Copy invite link"
                    >
                      <Copy />
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            {members.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members.data && members.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {members.data.map((member) => {
                  const isSelf = member.user_id === user?.id;
                  const manageable = canManageRoles && !isSelf;
                  return (
                    <li
                      key={member.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0"
                    >
                      <Avatar>
                        <AvatarFallback>{getInitials(member.profiles?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {member.profiles?.full_name ?? 'Pending member'}
                          {isSelf ? (
                            <span className="ml-2 text-xs text-muted-foreground">You</span>
                          ) : null}
                        </p>
                        {!manageable ? (
                          <p className="text-xs text-muted-foreground">{roleLabel(member.role)}</p>
                        ) : null}
                      </div>

                      {manageable ? (
                        <Select
                          value={member.role}
                          onValueChange={(role) => changeRole(member, role)}
                          disabled={updateRole.isPending}
                        >
                          <SelectTrigger
                            className="h-8 w-36"
                            aria-label={`Role for ${member.profiles?.full_name ?? 'member'}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MANAGEABLE_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {roleLabel(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}

                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          member.status === 'active'
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {member.status}
                      </span>

                      {manageable ? (
                        <button
                          type="button"
                          onClick={() => remove(member)}
                          disabled={removeMember.isPending}
                          className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                          aria-label={`Remove ${member.profiles?.full_name ?? 'member'}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={Users}
                title="No members yet"
                description="Invite your first teammate to collaborate."
              />
            )}
          </CardContent>
        </Card>

        {invitations.data && invitations.data.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Pending invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {invitations.data.map((invitation) => (
                  <li
                    key={invitation.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Mail className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{invitation.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {roleLabel(invitation.role)} · expires {formatDate(invitation.expires_at)}
                      </p>
                    </div>
                    <span className="ml-auto rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                      pending
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
