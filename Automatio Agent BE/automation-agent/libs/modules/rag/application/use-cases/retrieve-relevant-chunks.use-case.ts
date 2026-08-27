import { Injectable } from '@nestjs/common';
import { HybridSearchService, HybridSearchResult } from '../services/hybrid-search.service';
import { ReRankingService } from '../services/re-ranking.service';

/**
 * 🎯 Use Case — bước [7]+[8]+[9] của RAG Pipeline (TDD Mục 7.2):
 * `RetrieveRelevantChunksUseCase`. Đóng gói toàn bộ retrieval pipeline
 * (embed → hybrid search → re-rank) thành 1 điểm gọi duy nhất cho
 * `GenerateAnswerUseCase` (bước [10]+[11]) và cho endpoint test nội bộ
 * `/rag/query`.
 */
@Injectable()
export class RetrieveRelevantChunksUseCase {
  constructor(
    private readonly hybridSearchService: HybridSearchService,
    private readonly reRankingService: ReRankingService,
  ) {}

  async execute(query: string): Promise<HybridSearchResult[]> {
    const hybridResults = await this.hybridSearchService.search(query);
    if (hybridResults.length === 0) return [];
    return this.reRankingService.rerank(query, hybridResults);
  }
}
