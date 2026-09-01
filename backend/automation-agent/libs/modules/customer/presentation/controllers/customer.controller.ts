import { Controller, Get, Param } from '@nestjs/common';
import { Roles } from '@app/shared/decorators/roles.decorator';
import { Role } from '@app/shared/types/role.enum';
import { CustomerResponseDto } from '../../application/dto/customer.dto';
import { GetCustomerHistoryUseCase } from '../../application/use-cases/get-customer-history.use-case';

/**
 * Nội bộ — dùng cho Agent tra cứu (TDD Mục 5.2). Không có endpoint tạo
 * Customer trực tiếp: Customer luôn được tạo gián tiếp qua
 * FindOrCreateCustomerUseCase khi Ticket Module tạo ticket mới.
 */
@Controller('customers')
export class CustomerController {
  constructor(private readonly getCustomerHistory: GetCustomerHistoryUseCase) {}

  @Get(':id')
  @Roles(Role.AGENT, Role.ADMIN)
  async getById(@Param('id') id: string): Promise<CustomerResponseDto> {
    return this.getCustomerHistory.execute(id);
  }
}
