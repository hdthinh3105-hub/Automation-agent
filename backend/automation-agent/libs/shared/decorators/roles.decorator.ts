import { SetMetadata } from '@nestjs/common';
import { Role } from '../types/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Usage: @Roles(Role.ADMIN) on a controller method, combined with
 * RolesGuard (registered globally) to enforce RBAC.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
