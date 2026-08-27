import { ErrorCode } from './error-codes';

/**
 * Base class for exceptions raised from the Domain/Application layer.
 * These are framework-agnostic (no HTTP concepts) — the Presentation
 * layer's Global Exception Filter maps them to the right HTTP status
 * via ERROR_CODE_HTTP_STATUS.
 */
export class DomainException extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ResourceNotFoundException extends DomainException {
  constructor(resource: string, identifier: string) {
    super(ErrorCode.RESOURCE_NOT_FOUND, `${resource} with id "${identifier}" was not found`, {
      resource,
      identifier,
    });
  }
}
