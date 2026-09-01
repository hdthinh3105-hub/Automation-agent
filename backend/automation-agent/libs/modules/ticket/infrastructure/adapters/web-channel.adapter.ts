import { Injectable } from '@nestjs/common';
import { IChannelAdapter, CreateTicketCommand } from '../../application/ports/channel-adapter.port';
import { CreateTicketDto } from '../../application/dto/ticket.dto';

/**
 * Channel Adapter — Must have (TDD Mục 5.3, 14). Kênh Web nhận trực tiếp
 * qua REST nên `parseIncoming` gần như 1-1 với body request; các kênh
 * khác (Email/Telegram) parse phức tạp hơn nhưng cùng trả về
 * CreateTicketCommand để hội tụ về CreateTicketUseCase duy nhất.
 */
@Injectable()
export class WebChannelAdapter implements IChannelAdapter {
  parseIncoming(rawPayload: CreateTicketDto): CreateTicketCommand {
    return {
      customerEmail: rawPayload.customerEmail,
      customerName: rawPayload.customerName,
      subject: rawPayload.subject,
      content: rawPayload.content,
      channel: 'WEB',
    };
  }

  async sendReply(_ticketId: string, _content: string): Promise<void> {
    // Kênh Web: khách đọc phản hồi qua GET /tickets/:id, không cần "đẩy" chủ động.
    return;
  }
}
