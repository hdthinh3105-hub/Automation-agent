import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { User } from '../../domain/entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

/**
 * 🔌 Port — implemented by Infrastructure (PrismaUserRepository).
 * Application/Domain code depends only on this interface.
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
  list(params: { page: number; limit: number; role?: string }): Promise<{
    items: User[];
    totalItems: number;
  }>;
}

/**
 * 🔌 Port — implemented by Infrastructure (PrismaRefreshTokenRepository).
 */
export interface IRefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  findById(id: string): Promise<RefreshToken | null>;
  revokeAllForUser(userId: string): Promise<void>;
}
