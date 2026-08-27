import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from '@app/shared/types/role.enum';
import { LoginUseCase } from '@app/modules/identity/application/use-cases/login.use-case';
import { User } from '@app/modules/identity/domain/entities/user.entity';
import { Email } from '@app/modules/identity/domain/value-objects/email.vo';
import { InvalidCredentialsException } from '@app/modules/identity/domain/exceptions/identity.exception';
import {
  IRefreshTokenRepository,
  IUserRepository,
} from '@app/modules/identity/application/ports/repository.ports';
import { IPasswordHasher } from '@app/modules/identity/application/ports/password-hasher.port';
import { ITokenService } from '@app/modules/identity/application/ports/token-service.port';

describe('LoginUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let tokenService: jest.Mocked<ITokenService>;
  let eventEmitter: EventEmitter2;
  let useCase: LoginUseCase;

  const existingUser = User.create({
    id: 'user-1',
    email: Email.create('agent@example.com'),
    passwordHash: 'hashed-password',
    role: Role.AGENT,
  });

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      existsByEmail: jest.fn(),
      list: jest.fn(),
    };
    refreshTokenRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    passwordHasher = { hash: jest.fn(), compare: jest.fn() };
    tokenService = {
      signAccessToken: jest.fn().mockReturnValue('signed.jwt.token'),
      generateOpaqueRefreshToken: jest.fn().mockReturnValue({
        id: 'token-id',
        secret: 'token-secret',
        raw: 'token-id.token-secret',
      }),
      hashSecret: jest.fn().mockResolvedValue('hashed-secret'),
      compareSecret: jest.fn(),
      getRefreshTokenTtlMs: jest.fn().mockReturnValue(7 * 24 * 60 * 60 * 1000),
    };
    eventEmitter = new EventEmitter2();

    useCase = new LoginUseCase(
      userRepository,
      refreshTokenRepository,
      passwordHasher,
      tokenService,
      eventEmitter,
    );
  });

  it('throws InvalidCredentialsException when the email does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'unknown@example.com', password: 'whatever' }),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('throws InvalidCredentialsException when the password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue(existingUser);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'agent@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('returns an access + refresh token pair on valid credentials', async () => {
    userRepository.findByEmail.mockResolvedValue(existingUser);
    passwordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({ email: 'agent@example.com', password: 'correct' });

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.refreshToken).toBe('token-id.token-secret');
    expect(result.user).toEqual({ id: 'user-1', email: 'agent@example.com', role: Role.AGENT });
    expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1);
  });

  it('emits a UserLoggedInEvent after a successful login', async () => {
    userRepository.findByEmail.mockResolvedValue(existingUser);
    passwordHasher.compare.mockResolvedValue(true);
    const listener = jest.fn();
    eventEmitter.on('identity.user.logged_in', listener);

    await useCase.execute({ email: 'agent@example.com', password: 'correct' });

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
