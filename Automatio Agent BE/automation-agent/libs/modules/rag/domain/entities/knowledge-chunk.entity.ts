import { Entity } from '@app/shared/base/entity.base';

export interface KnowledgeChunkProps {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  section: string | null;
  createdAt: Date;
}

/**
 * 🔑 Entity — 1 đoạn văn bản đã được chunk từ `KnowledgeDocument`
 * (TDD Mục 5.6/7.2 bước [3]). `section` giữ heading gốc (nếu tài liệu có
 * cấu trúc Markdown/DOCX) để tăng chất lượng retrieval + hiển thị citation.
 */
export class KnowledgeChunk extends Entity<string> {
  private props: KnowledgeChunkProps;

  private constructor(props: KnowledgeChunkProps) {
    super(props.id);
    this.props = props;
  }

  public static create(params: {
    id: string;
    documentId: string;
    content: string;
    chunkIndex: number;
    section?: string | null;
  }): KnowledgeChunk {
    return new KnowledgeChunk({
      id: params.id,
      documentId: params.documentId,
      content: params.content,
      chunkIndex: params.chunkIndex,
      // Xấp xỉ ~4 ký tự/token (TDD Mục 5.4 dùng cùng heuristic cho
      // ConversationTurn.tokensEstimate) — đủ dùng cho budget config ở
      // Phase này; Prompt Builder (Đợt 2) sẽ dùng tokenizer thật khi cần.
      tokenCount: Math.ceil(params.content.length / 4),
      section: params.section ?? null,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: KnowledgeChunkProps): KnowledgeChunk {
    return new KnowledgeChunk(props);
  }

  public get documentId(): string {
    return this.props.documentId;
  }

  public get content(): string {
    return this.props.content;
  }

  public get chunkIndex(): number {
    return this.props.chunkIndex;
  }

  public get tokenCount(): number {
    return this.props.tokenCount;
  }

  public get section(): string | null {
    return this.props.section;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }
}
