import { Entity } from '@app/shared/base/entity.base';
import { MessageSender } from '../value-objects/message-sender.vo';

export interface TicketMessageProps {
  id: string;
  ticketId: string;
  sender: MessageSender;
  content: string;
  attachments: string[];
  channelMetadata: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * 📦 Entity (con của Ticket aggregate — TDD Mục 5.3).
 */
export class TicketMessage extends Entity<string> {
  private props: TicketMessageProps;

  private constructor(props: TicketMessageProps) {
    super(props.id);
    this.props = props;
  }

  public static create(params: {
    id: string;
    ticketId: string;
    sender: MessageSender;
    content: string;
    attachments?: string[];
    channelMetadata?: Record<string, unknown>;
  }): TicketMessage {
    if (!params.content?.trim()) {
      throw new Error('Ticket message content must not be empty');
    }
    return new TicketMessage({
      id: params.id,
      ticketId: params.ticketId,
      sender: params.sender,
      content: params.content.trim(),
      attachments: params.attachments ?? [],
      channelMetadata: params.channelMetadata ?? null,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: TicketMessageProps): TicketMessage {
    return new TicketMessage(props);
  }

  public get ticketId(): string {
    return this.props.ticketId;
  }

  public get sender(): MessageSender {
    return this.props.sender;
  }

  public get content(): string {
    return this.props.content;
  }

  public get attachments(): string[] {
    return this.props.attachments;
  }

  public get channelMetadata(): Record<string, unknown> | null {
    return this.props.channelMetadata;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }
}
