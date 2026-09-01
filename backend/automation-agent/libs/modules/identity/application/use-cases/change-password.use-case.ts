import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsException } from '../../domain/exceptions/identity.exception';
import { ResourceNotFoundException } from '@app/shared/exceptions/domain.exception';
import {
  IRefreshTokenRepository,
  IUserRepository,
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from '../ports/repository.ports';
import { PASSWORD_HASHER, IPasswordHasher } from '../ports/password-hasher.port';

export interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * 🎯 Use Case — user-initiated password change. Requires the current
 * password (unlike an Admin reset) and revokes all existing refresh
 * tokens so other sessions are forced to re-authenticate.
 */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new ResourceNotFoundException('User', command.userId);
    }

    const matches = await this.passwordHasher.compare(command.currentPassword, user.passwordHash);
    if (!matches) {
      throw new InvalidCredentialsException();
    }

    const newHash = await this.passwordHasher.hash(command.newPassword);
    user.changePasswordHash(newHash);
    await this.userRepository.save(user);
    await this.refreshTokenRepository.revokeAllForUser(user.id);
  }
}
