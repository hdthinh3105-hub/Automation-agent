import { Inject, Injectable } from '@nestjs/common';
import {
  CONVERSATION_REPOSITORY,
  IConversationRepository,
} from '../ports/conversation-repository.port';
import { ConversationNotFoundException } from '../../domain/exceptions/conversation.exception';
import { ConversationContextResponseDto } from '../dto/conversation.dto';

// TDD Mục 5.4 — "N lượt gần nhất verbatim + summary các lượt cũ hơn".
// Ngưỡng này nên chuyển qua Settings Module ở Phase 5+; tạm hard-code.
const DEFAULT_RECENT_TURNS = 10;

/**
 * 🎯 Use Case — trả N turn gần nhất + summary, có "budget" (TDD Mục
 * 5.4: ContextWindowBuilderService). SummarizeConversationUseCase (nén
 * bằng LLM khi turnCount vượt ngưỡng) để dành Phase 5 khi có
 * ILlmProvider.
 */
@Injectable()
export class GetConversationContextUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
  ) {}

  async execute(ticketId: string): Promise<ConversationContextResponseDto> {
    const conversation = await this.conversationRepository.findByTicketId(ticketId);
    if (!conversation) {
      throw new ConversationNotFoundException(ticketId);
    }

    const turns = await this.conversationRepository.getRecentTurns(
      conversation.id,
      DEFAULT_RECENT_TURNS,
    );

    return {
      ticketId,
      summary: conversation.summary,
      turns: turns.map((t) => ({
        id: t.id,
        role: t.role,
        content: t.content,
        createdAt: t.createdAt,
      })),
    };
  }
}
