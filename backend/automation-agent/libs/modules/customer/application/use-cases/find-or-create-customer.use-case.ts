import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Customer } from '../../domain/entities/customer.entity';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../ports/customer-repository.port';

export interface FindOrCreateCustomerCommand {
  email: string;
  name?: string;
  phone?: string;
}

/**
 * 🎯 Use Case — dùng bởi Ticket Module (Facade) khi khách hàng tạo ticket
 * mới. Không có khái niệm "đăng ký" — email mới thì tự tạo, email cũ thì
 * gắn vào customer sẵn có (TDD Mục 5.2).
 */
@Injectable()
export class FindOrCreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: FindOrCreateCustomerCommand): Promise<Customer> {
    const email = command.email.trim().toLowerCase();
    const existing = await this.customerRepository.findByEmail(email);
    if (existing) {
      return existing;
    }

    const customer = Customer.create({
      id: uuid(),
      email,
      name: command.name,
      phone: command.phone,
    });
    await this.customerRepository.save(customer);
    return customer;
  }
}
