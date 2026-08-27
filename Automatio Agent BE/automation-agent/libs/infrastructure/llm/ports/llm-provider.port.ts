export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface LlmCompletionResult {
  content: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
}

/**
 * 🔌 Port — Application/Domain định nghĩa, Infrastructure implement
 * (Dependency Inversion, TDD Mục 2.2/2.6). Tách theo capability
 * (`complete`, `summarize`) thay vì 1 method chung để adapter tương lai
 * (vd model chỉ hỗ trợ chat, không hỗ trợ function-calling) vẫn implement
 * được từng phần mà không vi phạm Liskov Substitution.
 */
export interface ILlmProvider {
  readonly providerName: string;

  /** Sinh câu trả lời tự do từ 1 chuỗi message (dùng cho RAG Answer Generation, Classification, v.v.) */
  complete(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<LlmCompletionResult>;

  /** Tóm tắt 1 đoạn text dài (dùng cho Conversation Summarization — Phase 6+) */
  summarize(text: string, maxWords?: number): Promise<LlmCompletionResult>;
}
