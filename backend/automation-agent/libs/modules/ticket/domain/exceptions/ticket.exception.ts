import { DomainException } from '@app/shared/exceptions/domain.exception';
import { ErrorCode } from '@app/shared/exceptions/error-codes';
import { TicketStatus } from '../value-objects/ticket-status.vo';

export class TicketNotFoundException extends DomainException {
  constructor(id: string) {
    super(ErrorCode.TICKET_NOT_FOUND, `Ticket with id "${id}" was not found`, { id });
  }
}

/**
 * TDD Mục 9 — "Transition không hợp lệ ném InvalidTicketTransitionException
 * (domain exception, không phải HTTP exception — được map ở Presentation layer)".
 */
export class InvalidTicketTransitionException extends DomainException {
  constructor(currentStatus: TicketStatus, targetStatus: TicketStatus) {
    super(
      ErrorCode.TICKET_INVALID_TRANSITION,
      `Cannot transition ticket from ${currentStatus} to ${targetStatus}`,
      { currentStatus, targetStatus },
    );
  }
}
