import { Inject, Injectable } from '@nestjs/common';
import { paginate, PaginatedResult } from '@app/shared/dto/pagination.dto';
import { UserResponseDto } from '../dto/user.dto';
import { IUserRepository, USER_REPOSITORY } from '../ports/repository.ports';

export interface ListUsersQuery {
  page: number;
  limit: number;
  role?: string;
}

/**
 * 🎯 Query Use Case — CQRS query side for the Identity Module
 * (kept separate from CreateAgentUseCase/Command side per TDD Mục 2.5).
 */
@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository) {}

  async execute(query: ListUsersQuery): Promise<PaginatedResult<UserResponseDto>> {
    const { items, totalItems } = await this.userRepository.list(query);

    const dtos: UserResponseDto[] = items.map((user) => ({
      id: user.id,
      email: user.email.value,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));

    return paginate(dtos, totalItems, query.page, query.limit);
  }
}
