import { KnowledgeChunk as PrismaKnowledgeChunk } from '@prisma/client';
import { KnowledgeChunk } from '../../domain/entities/knowledge-chunk.entity';

export class ChunkMapper {
  static toDomain(record: PrismaKnowledgeChunk): KnowledgeChunk {
    return KnowledgeChunk.reconstitute({
      id: record.id,
      documentId: record.documentId,
      content: record.content,
      chunkIndex: record.chunkIndex,
      tokenCount: record.tokenCount,
      section: record.section,
      createdAt: record.createdAt,
    });
  }

  static toPersistence(chunk: KnowledgeChunk) {
    return {
      id: chunk.id,
      documentId: chunk.documentId,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      tokenCount: chunk.tokenCount,
      section: chunk.section,
      createdAt: chunk.createdAt,
    };
  }
}
