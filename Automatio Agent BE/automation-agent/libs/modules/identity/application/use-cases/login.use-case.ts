import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Email } from '../../domain/value-objects/email.vo';
import { InvalidCredentialsException } from '../../domain/exceptions/identity.exception';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { TokenResponseDto } from '../dto/auth.dto';
import {
  IRefreshTokenRepository,
  IUserRepository,
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from '../ports/repository.ports';
import { PASSWORD_HASHER, IPasswordHasher } from '../ports/password-hasher.port';
import { ITokenService, TOKEN_SERVICE } from '../ports/token-service.port';

export interface LoginCommand {
  email: string;
  password: string;
  ipAddress?: string;
}

/**
 * 🎯 Use Case — authenticates a user and issues an access + refresh
 * token pair. Deliberately does NOT reveal whether the email exists vs
 * the password was wrong (both map to the same InvalidCredentialsException)
 * to avoid user enumeration.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: LoginCommand): Promise<TokenResponseDto> {
    const email = Email.create(command.email);
    const user = await this.userRepository.findByEmail(email.value);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await this.passwordHasher.compare(command.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    user.assertCanLogin();
    user.recordSuccessfulLogin(command.ipAddress);

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email.value,
      role: user.role,
    });

    const opaque = this.tokenService.generateOpaqueRefreshToken();
    const tokenHash = await this.tokenService.hashSecret(opaque.secret);
    const refreshToken = RefreshToken.create({
      id: opaque.id,
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + this.tokenService.getRefreshTokenTtlMs()),
    });
    await this.refreshTokenRepository.save(refreshToken);

    // Dispatch domain events raised on the aggregate (e.g. UserLoggedInEvent)
    // AFTER the write succeeded, then clear them.
    for (const event of user.domainEvents) {
      this.eventEmitter.emit(event.eventName, event);
    }
    user.clearDomainEvents();

    return {
      accessToken,
      refreshToken: opaque.raw,
      user: { id: user.id, email: user.email.value, role: user.role },
    };
  }
}
