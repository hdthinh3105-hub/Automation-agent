import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '@app/shared/decorators/roles.decorator';
import { Role } from '@app/shared/types/role.enum';
import { RagQueryDto, AnswerWithCitationDto } from '../../application/dto/rag-query.dto';
import { GenerateAnswerUseCase } from '../../application/use-cases/generate-answer.use-case';

/**
 * TDD Mục 5.6 — "không expose trực tiếp ra ngoài (được gọi qua AI Module
 * Facade); có thể expose `/rag/query` cho mục đích test nội bộ/Admin".
 * Đợt 2 chưa có AI Module (Phase 6) để làm Facade, nên tạm expose thẳng
 * endpoint này cho Admin/Agent test tay pipeline Retrieval + Generation
 * end-to-end trước khi AI Module orchestrator (Phase 6) gọi lại qua
 * `GenerateAnswerUseCase` như 1 bước trong `ProcessIncomingMessageUseCase`.
 */
@Controller('rag')
export class RagController {
  constructor(private readonly generateAnswerUseCase: GenerateAnswerUseCase) {}

  @Post('query')
  @Roles(Role.ADMIN, Role.AGENT)
  async query(@Body() dto: RagQueryDto): Promise<AnswerWithCitationDto> {
    return this.generateAnswerUseCase.execute(dto.query);
  }
}
