import {
  KnowledgeDocument as PrismaKnowledgeDocument,
  DocumentSourceType as PrismaDocumentSourceType,
  DocumentStatus as PrismaDocumentStatus,
} from '@prisma/client';
import {
  KnowledgeDocument,
  DocumentSourceType,
  DocumentStatus,
} from '../../domain/entities/knowledge-document.entity';

function assertKnownEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: string,
  label: string,
): T[keyof T] {
  if (!Object.values(enumObj).includes(value as T[keyof T])) {
    throw new Error(`Unknown ${label} value from DB: ${value}`);
  }
  return value as T[keyof T];
}

export class KnowledgeDocumentMapper {
  static toDomain(record: PrismaKnowledgeDocument): KnowledgeDocument {
    return KnowledgeDocument.reconstitute({
      id: record.id,
      title: record.title,
      sourceType: assertKnownEnumValue(DocumentSourceType, record.sourceType, 'DocumentSourceType'),
      filePath: record.filePath,
      status: assertKnownEnumValue(DocumentStatus, record.status, 'DocumentStatus'),
      version: record.version,
      tags: record.tags,
      uploadedBy: record.uploadedBy,
      createdAt: record.createdAt,
      deletedAt: record.deletedAt,
    });
  }

  static toPersistence(document: KnowledgeDocument) {
    return {
      id: document.id,
      title: document.title,
      sourceType: document.sourceType as unknown as PrismaDocumentSourceType,
      filePath: document.filePath,
      status: document.status as unknown as PrismaDocumentStatus,
      version: document.version,
      tags: document.tags,
      uploadedBy: document.uploadedBy,
      createdAt: document.createdAt,
      deletedAt: document.deletedAt,
    };
  }
}
