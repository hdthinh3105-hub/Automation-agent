import { Inject, Injectable } from '@nestjs/common';
import { paginate, PaginatedResult } from '@app/shared/dto/pagination.dto';
import {
  KNOWLEDGE_DOCUMENT_REPOSITORY,
  IKnowledgeDocumentRepository,
  ListDocumentsFilter,
} from '../ports/knowledge-document-repository.port';
import { DocumentNotFoundException } from '../../domain/exceptions/knowledge-document.exception';
import { DocumentResponseDto } from '../dto/knowledge-document.dto';

@Injectable()
export class ListDocumentsUseCase {
  constructor(
    @Inject(KNOWLEDGE_DOCUMENT_REPOSITORY)
    private readonly documentRepository: IKnowledgeDocumentRepository,
  ) {}

  async execute(filter: ListDocumentsFilter): Promise<PaginatedResult<DocumentResponseDto>> {
    const { items, totalItems } = await this.documentRepository.list(filter);
    const dtos: DocumentResponseDto[] = items.map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
      version: d.version,
      tags: d.tags,
      createdAt: d.createdAt,
    }));
    return paginate(dtos, totalItems, filter.page, filter.limit);
  }
}

/**
 * 🎯 Use Case — soft delete (giữ `deletedAt`, TDD Mục 10.3: "không
 * hard-delete để không phá vỡ tham chiếu từ knowledge_chunks/lịch sử
 * trả lời cũ đã cite tài liệu đó").
 */
@Injectable()
export class DeleteDocumentUseCase {
  constructor(
    @Inject(KNOWLEDGE_DOCUMENT_REPOSITORY)
    private readonly documentRepository: IKnowledgeDocumentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new DocumentNotFoundException(id);
    }
    document.markDeleted();
    await this.documentRepository.save(document);
  }
}
