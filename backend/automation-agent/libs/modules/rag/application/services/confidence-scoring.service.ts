import { Injectable } from '@nestjs/common';
import { HybridSearchResult } from './hybrid-search.service';

export interface ConfidenceInput {
  usedChunks: HybridSearchResult[];
  topKFinal: number;
  llmSelfScore: number | null;
}

export interface ConfidenceBreakdown {
  score: number;
  avgTopSimilarity: number;
  retrievalCoverage: number;
  llmSelfScore: number;
}

/**
 * 🎯 `ConfidenceScoringService` (TDD Mục 5.6/7.2 bước [12]) — KHÔNG chỉ
 * tin vào 1 con số LLM tự chấm (LLM tự đánh giá độ tin cậy của chính nó
 * thường không đáng tin), mà tổng hợp từ nhiều tín hiệu:
 * - Điểm similarity trung bình của top chunk được dùng (retrieval có đủ tốt không)
 * - Retrieval coverage: số chunk tìm được / topKFinal kỳ vọng
 * - LLM tự đánh giá (self-assessment, trọng số thấp — parse từ dòng
 *   "CONFIDENCE: x.xx" cuối câu trả lời, TDD PromptBuilder bước [10])
 *
 * Công thức: `confidence = 0.5*avgTopSimilarity + 0.3*retrievalCoverage + 0.2*llmSelfScore`.
 * Phát hiện mâu thuẫn giữa nguồn (giảm confidence nếu có) là hướng mở
 * rộng ở Phase 6 khi AI Module có đủ dữ liệu classification — chưa làm ở
 * Đợt 2 này, ghi rõ vào README/Nhật ký quyết định khi bàn giao.
 */
@Injectable()
export class ConfidenceScoringService {
  score(input: ConfidenceInput): ConfidenceBreakdown {
    const avgTopSimilarity = this.computeAvgSimilarity(input.usedChunks);
    const retrievalCoverage = Math.min(1, input.usedChunks.length / Math.max(1, input.topKFinal));
    const llmSelfScore = input.llmSelfScore ?? 0.5; // thiếu self-score -> coi như trung tính, không thưởng cũng không phạt

    const score = 0.5 * avgTopSimilarity + 0.3 * retrievalCoverage + 0.2 * llmSelfScore;

    return {
      score: Math.max(0, Math.min(1, score)),
      avgTopSimilarity,
      retrievalCoverage,
      llmSelfScore,
    };
  }

  private computeAvgSimilarity(chunks: HybridSearchResult[]): number {
    if (chunks.length === 0) return 0;
    // Ưu tiên vectorSimilarity thật (0..1) nếu có; chunk chỉ tìm được qua
    // full-text (không có trong top vector search) coi similarity = 0.3
    // (trung bình thấp — có khớp từ khoá nhưng không chắc khớp ngữ nghĩa).
    const values = chunks.map((c) => c.vectorSimilarity ?? 0.3);
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /** Parse dòng "CONFIDENCE: 0.73" ở cuối câu trả lời LLM, trả về null nếu không tìm thấy/không hợp lệ. */
  parseLlmSelfScore(answerText: string): { cleanedAnswer: string; selfScore: number | null } {
    const match = answerText.match(/CONFIDENCE:\s*([0-9]*\.?[0-9]+)\s*$/i);
    if (!match) {
      return { cleanedAnswer: answerText.trim(), selfScore: null };
    }
    const raw = parseFloat(match[1]);
    const selfScore = Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : null;
    const cleanedAnswer = answerText.slice(0, match.index).trim();
    return { cleanedAnswer, selfScore };
  }
}
