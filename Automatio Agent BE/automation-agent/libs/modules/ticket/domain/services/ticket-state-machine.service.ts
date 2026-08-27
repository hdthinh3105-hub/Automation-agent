import { Injectable } from '@nestjs/common';
import { Ticket } from '../entities/ticket.entity';
import { TicketStatus } from '../value-objects/ticket-status.vo';

/**
 * Domain Service — TDD Mục 9: "Mọi transition đi qua
 * TicketStateMachineService.transition(ticket, targetStatus, actor, reason)".
 * Giữ như một lớp mỏng gọi lại `Ticket.transitionTo` (nơi thực sự chứa
 * ma trận + invariant) để Use Case chỉ cần biết tới Domain Service này,
 * không thao tác trực tiếp lên aggregate.
 */
@Injectable()
export class TicketStateMachineService {
  transition(ticket: Ticket, targetStatus: TicketStatus, actor: string, reason?: string): void {
    ticket.transitionTo(targetStatus, actor, reason);
  }
}
