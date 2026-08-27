import { DomainException } from '@app/shared/exceptions/domain.exception';
import { ErrorCode } from '@app/shared/exceptions/error-codes';

export class DocumentParseFailedException extends DomainException {
  constructor(documentId: string, reason: string) {
    super(ErrorCode.DOCUMENT_PARSE_FAILED, `Failed to parse document "${documentId}": ${reason}`, {
      documentId,
      reason,
    });
  }
}

export class DocumentEmptyContentException extends DomainException {
  constructor(documentId: string) {
    super(
      ErrorCode.DOCUMENT_EMPTY_CONTENT,
      `Document "${documentId}" has no extractable text content`,
      { documentId },
    );
  }
}

export class ChunkNotFoundException extends DomainException {
  constructor(chunkId: string) {
    super(ErrorCode.CHUNK_NOT_FOUND, `Chunk with id "${chunkId}" was not found`, { chunkId });
  }
}
