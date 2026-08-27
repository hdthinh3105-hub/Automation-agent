import { Entity } from '@app/shared/base/entity.base';
import { TicketStatus } from '../value-objects/ticket-status.vo';

export interface TicketStatusHistoryProps {
  id: string;
  ticketId: string;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  changedBy: string;
  reason: string | null;
  changedAt: Date;
}

/**
 * 📦 Entity — phục vụ audit/timeline UI (TDD Mục 9, 10.2).
 */
export class TicketStatusHistory extends Entity<string> {
  private props: TicketStatusHistoryProps;

  private constructor(props: TicketStatusHistoryProps) {
    super(props.id);
    this.props = props;
  }

  public static create(params: {
    id: string;
    ticketId: string;
    fromStatus: TicketStatus;
    toStatus: TicketStatus;
    changedBy: string;
    reason?: string;
  }): TicketStatusHistory {
    return new TicketStatusHistory({
      id: params.id,
      ticketId: params.ticketId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      changedBy: params.changedBy,
      reason: params.reason ?? null,
      changedAt: new Date(),
    });
  }

  public static reconstitute(props: TicketStatusHistoryProps): TicketStatusHistory {
    return new TicketStatusHistory(props);
  }

  public get ticketId(): string {
    return this.props.ticketId;
  }

  public get fromStatus(): TicketStatus {
    return this.props.fromStatus;
  }

  public get toStatus(): TicketStatus {
    return this.props.toStatus;
  }

  public get changedBy(): string {
    return this.props.changedBy;
  }

  public get reason(): string | null {
    return this.props.reason;
  }

  public get changedAt(): Date {
    return this.props.changedAt;
  }
}
