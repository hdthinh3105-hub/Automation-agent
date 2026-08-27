import {
  Conversation as PrismaConversation,
  ConversationTurn as PrismaConversationTurn,
  TurnRole as PrismaTurnRole,
} from '@prisma/client';
import { Conversation } from '../../domain/entities/conversation.entity';
import { ConversationTurn, TurnRole } from '../../domain/entities/conversation-turn.entity';

function assertKnownTurnRole(value: string): TurnRole {
  if (!Object.values(TurnRole).includes(value as TurnRole)) {
    throw new Error(`Unknown TurnRole value from DB: ${value}`);
  }
  return value as TurnRole;
}

export class ConversationMapper {
  static toDomain(record: PrismaConversation): Conversation {
    return Conversation.reconstitute({
      id: record.id,
      ticketId: record.ticketId,
      summary: record.summary,
      turnCount: record.turnCount,
      lastActivityAt: record.lastActivityAt,
    });
  }

  static toPersistence(conversation: Conversation) {
    return {
      id: conversation.id,
      ticketId: conversation.ticketId,
      summary: conversation.summary,
      turnCount: conversation.turnCount,
      lastActivityAt: conversation.lastActivityAt,
    };
  }

  static turnToDomain(record: PrismaConversationTurn): ConversationTurn {
    return ConversationTurn.reconstitute({
      id: record.id,
      conversationId: record.conversationId,
      role: assertKnownTurnRole(record.role),
      content: record.content,
      tokensEstimate: record.tokensEstimate,
      createdAt: record.createdAt,
    });
  }

  static turnToPersistence(turn: ConversationTurn) {
    return {
      id: turn.id,
      conversationId: turn.conversationId,
      role: turn.role as unknown as PrismaTurnRole,
      content: turn.content,
      tokensEstimate: turn.tokensEstimate,
      createdAt: turn.createdAt,
    };
  }
}
