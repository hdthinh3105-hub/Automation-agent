export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  role: string;
}

export interface OpaqueRefreshToken {
  /** Public identifier (matches the RefreshToken entity/row id) — used for O(1) DB lookup. */
  id: string;
  /** Random secret portion — only its hash is ever persisted. */
  secret: string;
  /** `${id}.${secret}` — the value actually handed to the client. */
  raw: string;
}

/**
 * 🔌 Port — abstracts JWT signing/verification and opaque refresh-token
 * generation so Application code (LoginUseCase, RefreshTokenUseCase)
 * doesn't depend on @nestjs/jwt or bcrypt directly.
 *
 * Refresh tokens are opaque (`id.secret`), not JWTs: the `id` allows an
 * O(1) DB lookup, and only a bcrypt hash of `secret` is stored — so a
 * leaked database dump alone cannot be replayed as a valid session.
 */
export interface ITokenService {
  signAccessToken(payload: AccessTokenPayload): string;
  generateOpaqueRefreshToken(): OpaqueRefreshToken;
  hashSecret(secret: string): Promise<string>;
  compareSecret(secret: string, hash: string): Promise<boolean>;
  getRefreshTokenTtlMs(): number;
}
