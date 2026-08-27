/**
 * 🔌 Port — Channel Adapter Pattern (TDD Mục 5.3). Mỗi kênh
 * (Web/Email/ChatApp/Internal) implement port này ở Infrastructure;
 * tất cả hội tụ về cùng 1 CreateTicketUseCase, không rẽ nhánh business
 * logic theo kênh ở tầng Application/Domain (Open/Closed Principle).
 */
export interface CreateTicketCommand {
  customerEmail: string;
  customerName?: string;
  subject: string;
  content: string;
  channel: 'WEB' | 'EMAIL' | 'CHAT_APP' | 'INTERNAL';
  channelMetadata?: Record<string, unknown>;
}

export interface IChannelAdapter {
  parseIncoming(rawPayload: unknown): CreateTicketCommand;
  sendReply(ticketId: string, content: string): Promise<void>;
}
