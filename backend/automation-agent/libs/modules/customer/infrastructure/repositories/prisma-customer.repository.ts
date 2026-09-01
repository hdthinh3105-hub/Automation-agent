import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/infrastructure/prisma/prisma.service';
import { Customer } from '../../domain/entities/customer.entity';
import { ICustomerRepository } from '../../application/ports/customer-repository.port';
import { CustomerMapper } from './customer.mapper';

@Injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Customer | null> {
    const record = await this.prisma.customer.findUnique({ where: { email } });
    return record ? CustomerMapper.toDomain(record) : null;
  }

  async findById(id: string): Promise<Customer | null> {
    const record = await this.prisma.customer.findUnique({ where: { id } });
    return record ? CustomerMapper.toDomain(record) : null;
  }

  async save(customer: Customer): Promise<void> {
    const data = CustomerMapper.toPersistence(customer);
    await this.prisma.customer.upsert({
      where: { id: data.id },
      create: data,
      update: { name: data.name, phone: data.phone },
    });
  }
}
