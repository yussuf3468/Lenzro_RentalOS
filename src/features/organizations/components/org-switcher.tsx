import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth';
import { useMyOrganizations, useSwitchOrganization } from '../hooks/use-organizations';

export function OrgSwitcher() {
  const { claims } = useAuth();
  const navigate = useNavigate();
  const orgs = useMyOrganizations();
  const switchOrg = useSwitchOrganization();
  const active = orgs.data?.find((org) => org.id === claims.organizationId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 max-w-52 justify-start gap-2 px-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-brand text-ink-900">
            <Building2 className="size-3.5" />
          </span>
          <span className="truncate text-sm font-medium">
            {active?.name ?? 'Select organization'}
          </span>
          <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {orgs.data?.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => {
              if (org.id !== claims.organizationId) switchOrg.mutate(org.id);
            }}
          >
            <span className="truncate">{org.name}</span>
            {org.id === claims.organizationId ? (
              <Check className="ml-auto size-4 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/onboarding')}>
          <Plus />
          New organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
