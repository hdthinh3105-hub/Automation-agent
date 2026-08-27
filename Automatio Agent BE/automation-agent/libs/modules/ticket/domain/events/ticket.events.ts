import { IDomainEvent } from '@app/shared/base/aggregate-root.base';
import { TicketStatus } from '../value-objects/ticket-status.vo';

/**
 * Raised khi ticket mới được tạo. Audit Module + (Phase 6) AI Module
 * lắng nghe event này để trigger ProcessIncomingMessageUseCase (Observer
 * Pattern — TDD Mục 5.11).
 */
export class TicketCreatedEvent implements IDomainEvent {
  public readonly eventName = 'ticket.created';
  public readonly occurredAt: Date;

  constructor(
    public readonly ticketId: string,
    public readonly customerId: string,
    public readonly channel: string,
  ) {
    this.occurredAt = new Date();
  }
}

export class TicketStatusChangedEvent implements IDomainEvent {
  public readonly eventName = 'ticket.status_changed';
  public readonly occurredAt: Date;

  constructor(
    public readonly ticketId: string,
    public readonly fromStatus: TicketStatus,
    public readonly toStatus: TicketStatus,
    public readonly changedBy: string,
    public readonly reason?: string,
  ) {
    this.occurredAt = new Date();
  }
}

export class CustomerMessageAddedEvent implements IDomainEvent {
  public readonly eventName = 'ticket.customer_message_added';
  public readonly occurredAt: Date;

  constructor(
    public readonly ticketId: string,
    public readonly messageId: string,
  ) {
    this.occurredAt = new Date();
  }
}
