import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { Roles } from '@app/shared/decorators/roles.decorator';
import { Role } from '@app/shared/types/role.enum';
import { CurrentUser, AuthenticatedUser } from '@app/shared/decorators/current-user.decorator';
import { PaginatedResult } from '@app/shared/dto/pagination.dto';
import {
  ChangePasswordDto,
  CreateUserDto,
  ListUsersQueryDto,
  UserResponseDto,
} from '../../application/dto/user.dto';
import { CreateAgentUseCase } from '../../application/use-cases/create-agent.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';

@Controller('users')
export class UserController {
  constructor(
    private readonly createAgentUseCase: CreateAgentUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.createAgentUseCase.execute(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async list(@Query() query: ListUsersQueryDto): Promise<PaginatedResult<UserResponseDto>> {
    return this.listUsersUseCase.execute({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      role: query.role,
    });
  }

  @Patch('me/password')
  async changeOwnPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    await this.changePasswordUseCase.execute({
      userId: user.userId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
    return { success: true };
  }
}
