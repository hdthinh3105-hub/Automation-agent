export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');

/**
 * 🔌 Port — implement bởi `LocalEmbeddingProvider` (bge-small, mặc định
 * free-tier, TDD Mục 3) hoặc `GeminiEmbeddingProvider`. Ràng buộc quan
 * trọng (TDD Mục 7.2 bước [7]): query phải được embed bằng CÙNG model đã
 * dùng để index — `modelName`/`dimensions` được lưu kèm mỗi
 * `ChunkEmbedding` để guard việc so sánh vector khác chiều/khác model.
 */
export interface IEmbeddingProvider {
  readonly modelName: string;
  readonly dimensions: number;

  embed(texts: string[]): Promise<number[][]>;
}
