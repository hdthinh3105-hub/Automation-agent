import { Entity } from '@app/shared/base/entity.base';

export interface ConversationProps {
  id: string;
  ticketId: string;
  summary: string | null;
  turnCount: number;
  lastActivityAt: Date;
}

/**
 * 🔑 Aggregate Root — Conversation Module (TDD Mục 5.4). Tách khỏi
 * Ticket để giữ Single Responsibility: Ticket quản lý trạng thái
 * nghiệp vụ, Conversation quản lý ngữ cảnh chat phục vụ prompt
 * construction.
 */
export class Conversation extends Entity<string> {
  private props: ConversationProps;

  private constructor(props: ConversationProps) {
    super(props.id);
    this.props = props;
  }

  public static create(params: { id: string; ticketId: string }): Conversation {
    return new Conversation({
      id: params.id,
      ticketId: params.ticketId,
      summary: null,
      turnCount: 0,
      lastActivityAt: new Date(),
    });
  }

  public static reconstitute(props: ConversationProps): Conversation {
    return new Conversation(props);
  }

  public get ticketId(): string {
    return this.props.ticketId;
  }

  public get summary(): string | null {
    return this.props.summary;
  }

  public get turnCount(): number {
    return this.props.turnCount;
  }

  public get lastActivityAt(): Date {
    return this.props.lastActivityAt;
  }

  public recordTurnAppended(): void {
    this.props.turnCount += 1;
    this.props.lastActivityAt = new Date();
  }
}
