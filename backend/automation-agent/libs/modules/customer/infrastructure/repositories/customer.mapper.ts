import { Customer as PrismaCustomer } from '@prisma/client';
import { Customer } from '../../domain/entities/customer.entity';

export class CustomerMapper {
  static toDomain(record: PrismaCustomer): Customer {
    return Customer.reconstitute({
      id: record.id,
      email: record.email,
      name: record.name,
      phone: record.phone,
      metadata: record.metadata as Record<string, unknown> | null,
      firstSeenAt: record.firstSeenAt,
    });
  }

  static toPersistence(customer: Customer): {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
  } {
    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
    };
  }
}
