import { Conversation } from '../../domain/entities/conversation.entity';
import { ConversationTurn } from '../../domain/entities/conversation-turn.entity';

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

export interface IConversationRepository {
  findByTicketId(ticketId: string): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<void>;
  appendTurn(turn: ConversationTurn): Promise<void>;
  getRecentTurns(conversationId: string, limit: number): Promise<ConversationTurn[]>;
}
