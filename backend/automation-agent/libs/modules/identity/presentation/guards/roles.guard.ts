import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@app/shared/decorators/roles.decorator';
import { Role } from '@app/shared/types/role.enum';
import { AuthenticatedUser } from '@app/shared/decorators/current-user.decorator';

/**
 * Combined with @Roles(Role.ADMIN) on individual routes. Runs AFTER
 * JwtAuthGuard (registered later in the guard chain) so `request.user`
 * is already populated.
 */
@Injectable()
export class RolesGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user || !requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }
    return true;
  }
}
