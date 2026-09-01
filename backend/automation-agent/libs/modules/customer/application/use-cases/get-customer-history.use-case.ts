import { Inject, Injectable } from '@nestjs/common';
import { CUSTOMER_REPOSITORY, ICustomerRepository } from '../ports/customer-repository.port';
import { CustomerNotFoundException } from '../../domain/exceptions/customer.exception';
import { CustomerResponseDto } from '../dto/customer.dto';

/**
 * 🎯 Query Use Case. Trả về thông tin Customer; lịch sử ticket của
 * Customer được Ticket Module tự truy vấn qua ITicketReadRepository ở
 * tầng Controller/Facade — Customer Module KHÔNG import Ticket repo
 * (đúng ranh giới module, TDD Mục 2.4).
 */
@Injectable()
export class GetCustomerHistoryUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(id: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new CustomerNotFoundException(id);
    }
    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      firstSeenAt: customer.firstSeenAt,
    };
  }
}
