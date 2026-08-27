import { IDomainEvent } from '@app/shared/base/aggregate-root.base';

/**
 * Raised on successful login (TDD Mục 5.1 — "phục vụ Audit Module").
 * The Audit Module's wildcard listener picks this up without the
 * Identity Module depending on Audit directly (Observer Pattern).
 */
export class UserLoggedInEvent implements IDomainEvent {
  public readonly eventName = 'identity.user.logged_in';
  public readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly ipAddress?: string,
  ) {
    this.occurredAt = new Date();
  }
}
