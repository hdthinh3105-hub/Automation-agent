import { Customer } from '../../domain/entities/customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

/**
 * 🔌 Port — implemented by Infrastructure (PrismaCustomerRepository).
 */
export interface ICustomerRepository {
  findByEmail(email: string): Promise<Customer | null>;
  findById(id: string): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;
}
