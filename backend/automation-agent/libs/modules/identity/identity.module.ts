import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './presentation/controllers/auth.controller';
import { UserController } from './presentation/controllers/user.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { CreateAgentUseCase } from './application/use-cases/create-agent.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { REFRESH_TOKEN_REPOSITORY, USER_REPOSITORY } from './application/ports/repository.ports';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { TOKEN_SERVICE } from './application/ports/token-service.port';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { BcryptPasswordHasher } from './infrastructure/strategies/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/strategies/jwt-token.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Secret/expiry are re-read via ConfigService inside JwtTokenService for
    // access tokens; JwtModule itself is only needed so Nest can construct
    // the underlying JwtService used by that adapter.
    JwtModule.register({}),
  ],
  controllers: [AuthController, UserController],
  providers: [
    // Use Cases
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ChangePasswordUseCase,
    CreateAgentUseCase,
    ListUsersUseCase,

    // Guards (exported for global registration in AppModule)
    JwtAuthGuard,
    RolesGuard,

    // Strategy
    JwtStrategy,

    // Port -> Adapter bindings (Dependency Inversion)
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  exports: [JwtAuthGuard, RolesGuard, USER_REPOSITORY],
})
export class IdentityModule {}
