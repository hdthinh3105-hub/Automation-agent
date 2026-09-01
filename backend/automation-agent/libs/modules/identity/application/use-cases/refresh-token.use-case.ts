import { Inject, Injectable } from '@nestjs/common';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { InvalidRefreshTokenException } from '../../domain/exceptions/identity.exception';
import { TokenResponseDto } from '../dto/auth.dto';
import {
  IRefreshTokenRepository,
  IUserRepository,
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from '../ports/repository.ports';
import { ITokenService, TOKEN_SERVICE } from '../ports/token-service.port';

export interface RefreshTokenCommand {
  refreshToken: string;
}

/**
 * 🎯 Use Case — validates a presented refresh token and issues a new
 * access + refresh token pair, REVOKING the old refresh token in the
 * same operation ("rotation" — TDD Mục 11.1: "Revoke token cũ sau khi
 * refresh"). This limits the blast radius of a leaked refresh token:
 * it can only be used once before being invalidated.
 *
 * The presented token has the shape `id.secret` (see ITokenService):
 * `id` is used for an O(1) DB lookup, `secret` is compared against the
 * stored bcrypt hash.
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<TokenResponseDto> {
    const separatorIndex = command.refreshToken.indexOf('.');
    if (separatorIndex <= 0) {
      throw new InvalidRefreshTokenException();
    }
    const tokenId = command.refreshToken.slice(0, separatorIndex);
    const secret = command.refreshToken.slice(separatorIndex + 1);
    if (!tokenId || !secret) {
      throw new InvalidRefreshTokenException();
    }

    const existingToken = await this.refreshTokenRepository.findById(tokenId);
    if (!existingToken) {
      throw new InvalidRefreshTokenException();
    }

    const matches = await this.tokenService.compareSecret(secret, existingToken.tokenHash);
    RefreshToken.assertHashMatches(matches);

    existingToken.assertUsable();

    const user = await this.userRepository.findById(existingToken.userId);
    if (!user) {
      throw new InvalidRefreshTokenException();
    }
    user.assertCanLogin();

    // Rotation: revoke the old token, issue a brand new one.
    existingToken.revoke();
    await this.refreshTokenRepository.save(existingToken);

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email.value,
      role: user.role,
    });

    const opaque = this.tokenService.generateOpaqueRefreshToken();
    const tokenHash = await this.tokenService.hashSecret(opaque.secret);
    const newToken = RefreshToken.create({
      id: opaque.id,
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + this.tokenService.getRefreshTokenTtlMs()),
    });
    await this.refreshTokenRepository.save(newToken);

    return {
      accessToken,
      refreshToken: opaque.raw,
      user: { id: user.id, email: user.email.value, role: user.role },
    };
  }
}
