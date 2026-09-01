import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import {
  CONVERSATION_REPOSITORY,
  IConversationRepository,
} from '../ports/conversation-repository.port';
import { Conversation } from '../../domain/entities/conversation.entity';
import { ConversationTurn, TurnRole } from '../../domain/entities/conversation-turn.entity';

/**
 * 🎯 Use Case — tạo Conversation nếu chưa có (1-1 với Ticket, TDD Mục
 * 5.4), rồi append 1 turn. Dùng bởi AI Module (Phase 6) khi ghi lại
 * lượt hỏi/đáp, và bởi chính Ticket flow khi cần.
 */
@Injectable()
export class AppendTurnUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
  ) {}

  async execute(ticketId: string, role: TurnRole, content: string): Promise<ConversationTurn> {
    let conversation = await this.conversationRepository.findByTicketId(ticketId);
    if (!conversation) {
      conversation = Conversation.create({ id: uuid(), ticketId });
      await this.conversationRepository.save(conversation);
    }

    const turn = ConversationTurn.create({
      id: uuid(),
      conversationId: conversation.id,
      role,
      content,
    });
    await this.conversationRepository.appendTurn(turn);

    conversation.recordTurnAppended();
    await this.conversationRepository.save(conversation);

    return turn;
  }
}
