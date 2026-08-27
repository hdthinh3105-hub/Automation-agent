import { Controller, Get, Param } from '@nestjs/common';
import { Roles } from '@app/shared/decorators/roles.decorator';
import { Role } from '@app/shared/types/role.enum';
import { GetConversationContextUseCase } from '../../application/use-cases/get-conversation-context.use-case';
import { ConversationContextResponseDto } from '../../application/dto/conversation.dto';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly getConversationContext: GetConversationContextUseCase) {}

  @Get(':ticketId')
  @Roles(Role.AGENT, Role.ADMIN)
  async getByTicket(@Param('ticketId') ticketId: string): Promise<ConversationContextResponseDto> {
    return this.getConversationContext.execute(ticketId);
  }
}
