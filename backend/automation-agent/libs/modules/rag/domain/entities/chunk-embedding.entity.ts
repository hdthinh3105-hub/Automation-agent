import { Entity } from '@app/shared/base/entity.base';

export interface ChunkEmbeddingProps {
  chunkId: string;
  vector: number[];
  embeddingModel: string;
  dimensions: number;
  createdAt: Date;
}

/**
 * 📦 Entity — vector biểu diễn của 1 `KnowledgeChunk` (TDD Mục 5.6/10.3).
 * Tách bảng riêng khỏi KnowledgeChunk để hỗ trợ nhiều embedding/model
 * khác nhau trong tương lai (vd khi đổi embedding model, giữ cả cũ và
 * mới trong giai đoạn migration) mà không phá vỡ dữ liệu chunk gốc.
 */
export class ChunkEmbedding extends Entity<string> {
  private props: ChunkEmbeddingProps;

  private constructor(props: ChunkEmbeddingProps) {
    super(props.chunkId);
    this.props = props;
  }

  public static create(params: {
    chunkId: string;
    vector: number[];
    embeddingModel: string;
    dimensions: number;
  }): ChunkEmbedding {
    if (params.vector.length !== params.dimensions) {
      throw new Error(
        `Embedding vector length (${params.vector.length}) does not match declared dimensions (${params.dimensions})`,
      );
    }
    return new ChunkEmbedding({
      chunkId: params.chunkId,
      vector: params.vector,
      embeddingModel: params.embeddingModel,
      dimensions: params.dimensions,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: ChunkEmbeddingProps): ChunkEmbedding {
    return new ChunkEmbedding(props);
  }

  public get chunkId(): string {
    return this.props.chunkId;
  }

  public get vector(): number[] {
    return this.props.vector;
  }

  public get embeddingModel(): string {
    return this.props.embeddingModel;
  }

  public get dimensions(): number {
    return this.props.dimensions;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }
}
