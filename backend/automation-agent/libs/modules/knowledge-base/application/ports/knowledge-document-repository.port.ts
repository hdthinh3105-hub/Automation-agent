import { KnowledgeDocument } from '../../domain/entities/knowledge-document.entity';

export const KNOWLEDGE_DOCUMENT_REPOSITORY = Symbol('KNOWLEDGE_DOCUMENT_REPOSITORY');

export interface ListDocumentsFilter {
  status?: string;
  tag?: string;
  page: number;
  limit: number;
}

export interface IKnowledgeDocumentRepository {
  save(document: KnowledgeDocument): Promise<void>;
  findById(id: string): Promise<KnowledgeDocument | null>;
  list(filter: ListDocumentsFilter): Promise<{ items: KnowledgeDocument[]; totalItems: number }>;
}
