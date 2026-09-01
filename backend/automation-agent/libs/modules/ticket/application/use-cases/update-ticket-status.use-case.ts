import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';
import { ITicketRepository, TICKET_REPOSITORY } from '../ports/repository.ports';
import { TicketStateMachineService } from '../../domain/services/ticket-state-machine.service';
import { TicketStatusHistory } from '../../domain/entities/ticket-status-history.entity';
import { TicketStatus } from '../../domain/value-objects/ticket-status.vo';
import { TicketNotFoundException } from '../../domain/exceptions/ticket.exception';
import { TicketResponseDto } from '../dto/ticket.dto';

export interface UpdateTicketStatusCommand {
  ticketId: string;
  targetStatus: TicketStatus;
  changedBy: string;
  reason?: string;
}

/**
 * 🎯 Use Case — validate transition qua TicketStateMachineService, ghi
 * TicketStatusHistory, phát TicketStatusChangedEvent (TDD Mục 9).
 */
@Injectable()
export class UpdateTicketStatusUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepository: ITicketRepository,
    private readonly stateMachine: TicketStateMachineService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: UpdateTicketStatusCommand): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findById(command.ticketId);
    if (!ticket) {
      throw new TicketNotFoundException(command.ticketId);
    }

    const fromStatus = ticket.status;
    // Ném InvalidTicketTransitionException nếu sai — GlobalExceptionFilter
    // map thành 409 TICKET_INVALID_TRANSITION.
    this.stateMachine.transition(ticket, command.targetStatus, command.changedBy, command.reason);

    await this.ticketRepository.save(ticket);

    const history = TicketStatusHistory.create({
      id: uuid(),
      ticketId: ticket.id,
      fromStatus,
      toStatus: command.targetStatus,
      changedBy: command.changedBy,
      reason: command.reason,
    });
    await this.ticketRepository.saveStatusHistory(history);

    for (const event of ticket.domainEvents) {
      this.eventEmitter.emit(event.eventName, event);
    }
    ticket.clearDomainEvents();

    return {
      id: ticket.id,
      customerId: ticket.customerId,
      channel: ticket.channel,
      subject: ticket.subject,
      status: ticket.status,
      category: ticket.category,
      priority: ticket.priority,
      assignedAgentId: ticket.assignedAgentId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }
}
