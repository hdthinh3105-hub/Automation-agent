import { Module } from '@nestjs/common';
import { KNOWLEDGE_DOCUMENT_REPOSITORY } from './application/ports/knowledge-document-repository.port';
import { PrismaKnowledgeDocumentRepository } from './infrastructure/repositories/prisma-knowledge-document.repository';
import { UploadDocumentUseCase } from './application/use-cases/upload-document.use-case';
import {
  ListDocumentsUseCase,
  DeleteDocumentUseCase,
} from './application/use-cases/list-and-delete-document.use-case';
import { KnowledgeBaseController } from './presentation/controllers/knowledge-base.controller';

@Module({
  controllers: [KnowledgeBaseController],
  providers: [
    { provide: KNOWLEDGE_DOCUMENT_REPOSITORY, useClass: PrismaKnowledgeDocumentRepository },
    UploadDocumentUseCase,
    ListDocumentsUseCase,
    DeleteDocumentUseCase,
  ],
  exports: [KNOWLEDGE_DOCUMENT_REPOSITORY],
})
export class KnowledgeBaseModule {}
