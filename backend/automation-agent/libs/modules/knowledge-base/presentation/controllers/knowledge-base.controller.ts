import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '@app/shared/decorators/roles.decorator';
import { Role } from '@app/shared/types/role.enum';
import { CurrentUser, AuthenticatedUser } from '@app/shared/decorators/current-user.decorator';
import { PaginatedResult } from '@app/shared/dto/pagination.dto';
import {
  UploadDocumentDto,
  ListDocumentsQueryDto,
  DocumentResponseDto,
} from '../../application/dto/knowledge-document.dto';
import { UploadDocumentUseCase } from '../../application/use-cases/upload-document.use-case';
import {
  ListDocumentsUseCase,
  DeleteDocumentUseCase,
} from '../../application/use-cases/list-and-delete-document.use-case';

@Controller('kb/documents')
export class KnowledgeBaseController {
  constructor(
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.AGENT)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DocumentResponseDto> {
    return this.uploadDocumentUseCase.execute(file, dto.title, dto.tags, user.userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.AGENT)
  async list(@Query() query: ListDocumentsQueryDto): Promise<PaginatedResult<DocumentResponseDto>> {
    return this.listDocumentsUseCase.execute({
      status: query.status,
      tag: query.tag,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string): Promise<{ success: true }> {
    await this.deleteDocumentUseCase.execute(id);
    return { success: true };
  }
}
