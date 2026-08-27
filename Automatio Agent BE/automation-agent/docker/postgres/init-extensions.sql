-- Enables the pgvector extension used by the RAG Module (Phase 5).
-- Not needed by Phase 1+2, but harmless to enable up front so Phase 3
-- migrations that add vector columns won't need a separate step.
CREATE EXTENSION IF NOT EXISTS vector;
