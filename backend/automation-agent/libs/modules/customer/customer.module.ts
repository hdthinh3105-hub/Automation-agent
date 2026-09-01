import { Module } from '@nestjs/common';
import { CUSTOMER_REPOSITORY } from './application/ports/customer-repository.port';
import { PrismaCustomerRepository } from './infrastructure/repositories/prisma-customer.repository';
import { FindOrCreateCustomerUseCase } from './application/use-cases/find-or-create-customer.use-case';
import { GetCustomerHistoryUseCase } from './application/use-cases/get-customer-history.use-case';
import { CustomerController } from './presentation/controllers/customer.controller';

@Module({
  controllers: [CustomerController],
  providers: [
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
    FindOrCreateCustomerUseCase,
    GetCustomerHistoryUseCase,
  ],
  // FindOrCreateCustomerUseCase exported cho Ticket Module dùng qua Facade
  // (TDD Mục 2.4 — giao tiếp liên module chỉ qua Application Service export tường minh).
  exports: [FindOrCreateCustomerUseCase],
})
export class CustomerModule {}
