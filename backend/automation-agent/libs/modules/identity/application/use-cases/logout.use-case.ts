import { Inject, Injectable } from '@nestjs/common';
import { InvalidRefreshTokenException } from '../../domain/exceptions/identity.exception';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../ports/repository.ports';

export interface LogoutCommand {
  refreshToken: string;
}

/**
 * 🎯 Use Case — revokes the presented refresh token. Idempotent-ish:
 * if the token id can't be parsed or found we still throw, since a
 * logout request should always carry a token that was actually issued.
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const separatorIndex = command.refreshToken.indexOf('.');
    if (separatorIndex <= 0) {
      throw new InvalidRefreshTokenException();
    }
    const tokenId = command.refreshToken.slice(0, separatorIndex);

    const existingToken = await this.refreshTokenRepository.findById(tokenId);
    if (!existingToken) {
      throw new InvalidRefreshTokenException();
    }

    existingToken.revoke();
    await this.refreshTokenRepository.save(existingToken);
  }
}
