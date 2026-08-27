import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/infrastructure/prisma/prisma.service';
import {
  ITicketReadRepository,
  ListTicketsFilter,
  TicketListItem,
  TicketDetail,
  TicketTimelineEntry,
} from '../../application/ports/repository.ports';

@Injectable()
export class PrismaTicketReadRepository implements ITicketReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listTickets(
    filter: ListTicketsFilter,
  ): Promise<{ items: TicketListItem[]; totalItems: number }> {
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.category) where.category = filter.category;
    if (filter.assignedAgentId) where.assignedAgentId = filter.assignedAgentId;

    const [records, totalItems] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { email: true } } },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    const items: TicketListItem[] = records.map((r: (typeof records)[number]) => ({
      id: r.id,
      customerId: r.customerId,
      customerEmail: r.customer.email,
      channel: r.channel,
      subject: r.subject,
      status: r.status,
      category: r.category,
      priority: r.priority,
      assignedAgentId: r.assignedAgentId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return { items, totalItems };
  }

  async getTicketDetail(id: string): Promise<TicketDetail | null> {
    const record = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: { select: { email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!record) return null;

    return {
      id: record.id,
      customerId: record.customerId,
      customerEmail: record.customer.email,
      channel: record.channel,
      subject: record.subject,
      status: record.status,
      category: record.category,
      priority: record.priority,
      assignedAgentId: record.assignedAgentId,
      confidenceScore: record.confidenceScore,
      isSpam: record.isSpam,
      missingInfoFlags: record.missingInfoFlags,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      resolvedAt: record.resolvedAt,
      messages: record.messages.map((m: (typeof record.messages)[number]) => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  }

  async getTicketTimeline(id: string): Promise<TicketTimelineEntry[]> {
    const records = await this.prisma.ticketStatusHistory.findMany({
      where: { ticketId: id },
      orderBy: { changedAt: 'asc' },
    });
    return records.map((r: (typeof records)[number]) => ({
      fromStatus: r.fromStatus,
      toStatus: r.toStatus,
      changedBy: r.changedBy,
      reason: r.reason,
      changedAt: r.changedAt,
    }));
  }
}
