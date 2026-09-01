import { Entity } from '@app/shared/base/entity.base';
import {
  InvalidRefreshTokenException,
  RefreshTokenExpiredException,
  RefreshTokenRevokedException,
} from '../exceptions/identity.exception';

export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

/**
 * 📦 Entity (not an aggregate root of its own — belongs conceptually to
 * a user session). Stored hashed (`tokenHash`) so a leaked DB dump
 * cannot be replayed as a valid refresh token.
 */
export class RefreshToken extends Entity<string> {
  private props: RefreshTokenProps;

  private constructor(props: RefreshTokenProps) {
    super(props.id);
    this.props = props;
  }

  public static create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): RefreshToken {
    return new RefreshToken({
      id: params.id,
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get tokenHash(): string {
    return this.props.tokenHash;
  }

  public get expiresAt(): Date {
    return this.props.expiresAt;
  }

  public get isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  public assertUsable(): void {
    if (this.props.revokedAt !== null) {
      throw new RefreshTokenRevokedException();
    }
    if (this.props.expiresAt.getTime() < Date.now()) {
      throw new RefreshTokenExpiredException();
    }
  }

  public revoke(): void {
    if (this.props.revokedAt === null) {
      this.props.revokedAt = new Date();
    }
  }

  public static assertHashMatches(matches: boolean): void {
    if (!matches) {
      throw new InvalidRefreshTokenException();
    }
  }
}
