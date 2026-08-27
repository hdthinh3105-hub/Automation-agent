import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import {
  AccessTokenPayload,
  ITokenService,
  OpaqueRefreshToken,
} from '../../application/ports/token-service.port';
import { parseDurationToMs } from './duration.util';

const REFRESH_SECRET_BYTES = 32;
const REFRESH_TOKEN_HASH_ROUNDS = 10;

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
    });
  }

  generateOpaqueRefreshToken(): OpaqueRefreshToken {
    const id = randomUUID();
    const secret = randomBytes(REFRESH_SECRET_BYTES).toString('base64url');
    return { id, secret, raw: `${id}.${secret}` };
  }

  async hashSecret(secret: string): Promise<string> {
    return bcrypt.hash(secret, REFRESH_TOKEN_HASH_ROUNDS);
  }

  async compareSecret(secret: string, hash: string): Promise<boolean> {
    return bcrypt.compare(secret, hash);
  }

  getRefreshTokenTtlMs(): number {
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    return parseDurationToMs(expiresIn);
  }
}
