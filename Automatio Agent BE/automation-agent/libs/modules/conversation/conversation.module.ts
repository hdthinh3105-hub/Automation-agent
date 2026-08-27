import { Module } from '@nestjs/common';
import { CONVERSATION_REPOSITORY } from './application/ports/conversation-repository.port';
import { PrismaConversationRepository } from './infrastructure/repositories/prisma-conversation.repository';
import { AppendTurnUseCase } from './application/use-cases/append-turn.use-case';
import { GetConversationContextUseCase } from './application/use-cases/get-conversation-context.use-case';
import { ConversationController } from './presentation/controllers/conversation.controller';

@Module({
  controllers: [ConversationController],
  providers: [
    { provide: CONVERSATION_REPOSITORY, useClass: PrismaConversationRepository },
    AppendTurnUseCase,
    GetConversationContextUseCase,
  ],
  // AppendTurnUseCase export cho AI Module gọi qua Facade ở Phase 6.
  exports: [AppendTurnUseCase],
})
export class ConversationModule {}
