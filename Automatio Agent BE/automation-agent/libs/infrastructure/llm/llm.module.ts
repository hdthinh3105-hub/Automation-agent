import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroqLlmProvider } from './groq/groq-llm.provider';
import { GeminiLlmProvider } from './gemini/gemini-llm.provider';
import { GeminiEmbeddingProvider } from './gemini/gemini-embedding.provider';
import { LocalEmbeddingProvider } from './local-embedding/local-embedding.provider';
import { LlmOrchestratorProvider } from './llm-orchestrator.provider';
import { LLM_PROVIDER } from './ports/llm-provider.port';
import { EMBEDDING_PROVIDER } from './ports/embedding-provider.port';

/**
 * TDD Mục 4/5.7 — "Toàn bộ lời gọi LLM/Embedding đều đi qua Port ở
 * Domain/Application, Infrastructure là nơi implement adapter cụ thể".
 * `@Global()` vì hầu hết module nghiệp vụ (RAG, AI ở Phase 6) đều cần
 * `LLM_PROVIDER`/`EMBEDDING_PROVIDER` — tránh phải re-import ở mọi nơi.
 */
@Global()
@Module({
  providers: [
    GroqLlmProvider,
    GeminiLlmProvider,
    GeminiEmbeddingProvider,
    LocalEmbeddingProvider,
    LlmOrchestratorProvider,
    { provide: LLM_PROVIDER, useExisting: LlmOrchestratorProvider },
    {
      provide: EMBEDDING_PROVIDER,
      useFactory: (
        configService: ConfigService,
        local: LocalEmbeddingProvider,
        gemini: GeminiEmbeddingProvider,
      ) => (configService.get<string>('embedding.provider', 'local') === 'gemini' ? gemini : local),
      inject: [ConfigService, LocalEmbeddingProvider, GeminiEmbeddingProvider],
    },
  ],
  exports: [LLM_PROVIDER, EMBEDDING_PROVIDER, LlmOrchestratorProvider],
})
export class LlmModule {}
