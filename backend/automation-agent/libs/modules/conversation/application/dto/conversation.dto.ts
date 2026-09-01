export class TurnResponseDto {
  id!: string;
  role!: string;
  content!: string;
  createdAt!: Date;
}

export class ConversationContextResponseDto {
  ticketId!: string;
  summary!: string | null;
  turns!: TurnResponseDto[];
}
