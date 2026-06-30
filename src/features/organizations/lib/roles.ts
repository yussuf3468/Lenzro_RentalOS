/** Roles an Owner/Manager can assign when inviting a teammate. */
export const ASSIGNABLE_ROLES = [
  'manager',
  'accountant',
  'receptionist',
  'mechanic',
  'driver',
] as const;

/** Roles an Owner can assign when managing an existing member (includes owner). */
export const MANAGEABLE_ROLES = ['owner', ...ASSIGNABLE_ROLES] as const;

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  accountant: 'Accountant',
  receptionist: 'Receptionist',
  mechanic: 'Mechanic',
  driver: 'Driver',
  customer: 'Customer',
};

export function roleLabel(key: string): string {
  return ROLE_LABELS[key] ?? key;
}
