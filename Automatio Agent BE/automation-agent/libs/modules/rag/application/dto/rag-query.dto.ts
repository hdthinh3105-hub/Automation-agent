import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RagQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  query!: string;
}

export class CitationResponseDto {
  index!: number;
  chunkId!: string;
  documentId!: string;
  documentTitle!: string;
  section!: string | null;
}

export class AnswerWithCitationDto {
  answer!: string;
  citations!: CitationResponseDto[];
  confidence!: number;
  confidenceBreakdown!: {
    avgTopSimilarity: number;
    retrievalCoverage: number;
    llmSelfScore: number;
  };
  needsEscalation!: boolean;
  provider!: string;
  model!: string;
  latencyMs!: number;
}
