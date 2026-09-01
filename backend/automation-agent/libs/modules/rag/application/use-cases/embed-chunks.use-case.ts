import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  KNOWLEDGE_DOCUMENT_REPOSITORY,
  IKnowledgeDocumentRepository,
  DocumentNotFoundException,
} from '@app/modules/knowledge-base';
import { EMBEDDING_PROVIDER, IEmbeddingProvider } from '@app/infrastructure';
import { CHUNK_REPOSITORY, IChunkRepository } from '../ports/chunk-repository.port';
import { ChunkEmbedding } from '../../domain/entities/chunk-embedding.entity';
import { ChunksEmbeddedEvent } from '../../domain/events/rag.events';

/**
 * 🎯 Use Case — bước [5]+[6] của RAG Pipeline (TDD Mục 7.2): lấy toàn bộ
 * chunk CHƯA có embedding của 1 document, batch embed (giảm số request
 * tới API free-tier có rate-limit), lưu `ChunkEmbedding`, rồi chuyển
 * `KnowledgeDocument.status = READY`. Nếu không còn chunk nào để embed
 * (edge case: document rỗng sau chunk) vẫn coi là READY — không để
 * document kẹt mãi ở PROCESSING.
 */
@Injectable()
export class EmbedChunksUseCase {
  private readonly logger = new Logger(EmbedChunksUseCase.name);
  private readonly batchSize: number;

  constructor(
    @Inject(CHUNK_REPOSITORY) private readonly chunkRepository: IChunkRepository,
    @Inject(KNOWLEDGE_DOCUMENT_REPOSITORY)
    private readonly documentRepository: IKnowledgeDocumentRepository,
    @Inject(EMBEDDING_PROVIDER) private readonly embeddingProvider: IEmbeddingProvider,
    private readonly eventEmitter: EventEmitter2,
    configService: ConfigService,
  ) {
    this.batchSize = configService.get<number>('rag.embeddingBatchSize', 16);
  }

  /** @returns số lượng chunk đã được embed trong lần chạy này */
  async execute(documentId: string): Promise<number> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new DocumentNotFoundException(documentId);
    }

    const pendingChunks = await this.chunkRepository.findChunksWithoutEmbedding(documentId);
    let embeddedCount = 0;

    for (let i = 0; i < pendingChunks.length; i += this.batchSize) {
      const batch = pendingChunks.slice(i, i + this.batchSize);
      const vectors = await this.embeddingProvider.embed(batch.map((c) => c.content));

      for (let j = 0; j < batch.length; j++) {
        const embedding = ChunkEmbedding.create({
          chunkId: batch[j].id,
          vector: vectors[j],
          embeddingModel: this.embeddingProvider.modelName,
          dimensions: this.embeddingProvider.dimensions,
        });
        await this.chunkRepository.saveEmbedding(embedding);
        embeddedCount++;
      }
      this.logger.log(
        `Document "${documentId}": embedded ${embeddedCount}/${pendingChunks.length} chunk(s) so far.`,
      );
    }

    document.markReady();
    await this.documentRepository.save(document);
    this.eventEmitter.emit(
      'rag.chunks_embedded',
      new ChunksEmbeddedEvent(documentId, embeddedCount),
    );

    return embeddedCount;
  }
}
