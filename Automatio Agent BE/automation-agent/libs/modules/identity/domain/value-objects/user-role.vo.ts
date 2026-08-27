import { Role } from '@app/shared/types/role.enum';

/**
 * Re-exported here so Domain code depends on a module-local name while
 * still reusing the shared enum (avoids duplicating the role list).
 */
export { Role as UserRole };

export function isValidRole(value: string): value is Role {
  return Object.values(Role).includes(value as Role);
}
