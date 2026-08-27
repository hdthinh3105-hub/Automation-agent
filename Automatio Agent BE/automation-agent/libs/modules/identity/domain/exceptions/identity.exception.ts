import { DomainException } from '@app/shared/exceptions/domain.exception';
import { ErrorCode } from '@app/shared/exceptions/error-codes';

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_CREDENTIALS, 'Email or password is incorrect');
  }
}

export class AccountInactiveException extends DomainException {
  constructor() {
    super(ErrorCode.ACCOUNT_INACTIVE, 'This account has been deactivated');
  }
}

export class EmailAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(ErrorCode.EMAIL_ALREADY_EXISTS, `An account with email "${email}" already exists`, {
      email,
    });
  }
}

export class InvalidRefreshTokenException extends DomainException {
  constructor() {
    super(ErrorCode.INVALID_REFRESH_TOKEN, 'Refresh token is invalid');
  }
}

export class RefreshTokenRevokedException extends DomainException {
  constructor() {
    super(ErrorCode.REFRESH_TOKEN_REVOKED, 'Refresh token has been revoked');
  }
}

export class RefreshTokenExpiredException extends DomainException {
  constructor() {
    super(ErrorCode.REFRESH_TOKEN_EXPIRED, 'Refresh token has expired');
  }
}
