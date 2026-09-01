import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/infrastructure/prisma/prisma.service';
import { KnowledgeDocument } from '../../domain/entities/knowledge-document.entity';
import {
  IKnowledgeDocumentRepository,
  ListDocumentsFilter,
} from '../../application/ports/knowledge-document-repository.port';
import { KnowledgeDocumentMapper } from './knowledge-document.mapper';

@Injectable()
export class PrismaKnowledgeDocumentRepository implements IKnowledgeDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(document: KnowledgeDocument): Promise<void> {
    const data = KnowledgeDocumentMapper.toPersistence(document);
    await this.prisma.knowledgeDocument.upsert({
      where: { id: data.id },
      create: data,
      update: {
        title: data.title,
        status: data.status,
        version: data.version,
        tags: data.tags,
        deletedAt: data.deletedAt,
      },
    });
  }

  async findById(id: string): Promise<KnowledgeDocument | null> {
    const record = await this.prisma.knowledgeDocument.findUnique({ where: { id } });
    return record ? KnowledgeDocumentMapper.toDomain(record) : null;
  }

  async list(
    filter: ListDocumentsFilter,
  ): Promise<{ items: KnowledgeDocument[]; totalItems: number }> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.tag) where.tags = { has: filter.tag };

    const [records, totalItems] = await this.prisma.$transaction([
      this.prisma.knowledgeDocument.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.knowledgeDocument.count({ where }),
    ]);

    return { items: records.map(KnowledgeDocumentMapper.toDomain), totalItems };
  }
}
