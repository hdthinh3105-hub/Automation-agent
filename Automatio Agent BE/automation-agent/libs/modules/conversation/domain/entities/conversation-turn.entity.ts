import { Entity } from '@app/shared/base/entity.base';

export enum TurnRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

export interface ConversationTurnProps {
  id: string;
  conversationId: string;
  role: TurnRole;
  content: string;
  tokensEstimate: number;
  createdAt: Date;
}

/**
 * 📦 Entity — 1 lượt hội thoại (TDD Mục 5.4). `tokensEstimate` dùng
 * ~4 ký tự/token làm xấp xỉ cho context budget ở Phase này; Phase 5
 * (RAG Prompt Builder) sẽ thay bằng tokenizer thật khi ghép prompt.
 */
export class ConversationTurn extends Entity<string> {
  private props: ConversationTurnProps;

  private constructor(props: ConversationTurnProps) {
    super(props.id);
    this.props = props;
  }

  public static create(params: {
    id: string;
    conversationId: string;
    role: TurnRole;
    content: string;
  }): ConversationTurn {
    return new ConversationTurn({
      id: params.id,
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      tokensEstimate: Math.ceil(params.content.length / 4),
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: ConversationTurnProps): ConversationTurn {
    return new ConversationTurn(props);
  }

  public get conversationId(): string {
    return this.props.conversationId;
  }

  public get role(): TurnRole {
    return this.props.role;
  }

  public get content(): string {
    return this.props.content;
  }

  public get tokensEstimate(): number {
    return this.props.tokensEstimate;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }
}
