import { Inject, Injectable } from '@nestjs/common';
import { paginate, PaginatedResult } from '@app/shared/dto/pagination.dto';
import {
  ITicketReadRepository,
  TICKET_READ_REPOSITORY,
  ListTicketsFilter,
  TicketListItem,
} from '../ports/repository.ports';
import { TicketNotFoundException } from '../../domain/exceptions/ticket.exception';

@Injectable()
export class ListTicketsUseCase {
  constructor(
    @Inject(TICKET_READ_REPOSITORY) private readonly ticketReadRepository: ITicketReadRepository,
  ) {}

  async execute(filter: ListTicketsFilter): Promise<PaginatedResult<TicketListItem>> {
    const { items, totalItems } = await this.ticketReadRepository.listTickets(filter);
    return paginate(items, totalItems, filter.page, filter.limit);
  }
}

@Injectable()
export class GetTicketDetailUseCase {
  constructor(
    @Inject(TICKET_READ_REPOSITORY) private readonly ticketReadRepository: ITicketReadRepository,
  ) {}

  async execute(id: string) {
    const detail = await this.ticketReadRepository.getTicketDetail(id);
    if (!detail) {
      throw new TicketNotFoundException(id);
    }
    const timeline = await this.ticketReadRepository.getTicketTimeline(id);
    return { ...detail, timeline };
  }
}
