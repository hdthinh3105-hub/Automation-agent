import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Usage: @Public() on a controller method (e.g. /auth/login) to skip
 * the global JwtAuthGuard. Everything else is protected by default —
 * this is a deliberate "secure by default" choice.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
