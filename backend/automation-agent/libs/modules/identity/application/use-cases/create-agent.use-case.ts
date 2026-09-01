import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Role } from '@app/shared/types/role.enum';
import { Email } from '../../domain/value-objects/email.vo';
import { User } from '../../domain/entities/user.entity';
import { EmailAlreadyExistsException } from '../../domain/exceptions/identity.exception';
import { UserResponseDto } from '../dto/user.dto';
import { IUserRepository, USER_REPOSITORY } from '../ports/repository.ports';
import { PASSWORD_HASHER, IPasswordHasher } from '../ports/password-hasher.port';

export interface CreateAgentCommand {
  email: string;
  password: string;
  role: Role;
}

/**
 * 🎯 Use Case — Admin-only creation of Agent/Admin/Viewer accounts.
 * (End-customers never go through this — see TDD Mục 5.1: "customer
 * không cần tài khoản để tạo ticket qua kênh public".)
 */
@Injectable()
export class CreateAgentUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(command: CreateAgentCommand): Promise<UserResponseDto> {
    const email = Email.create(command.email);

    const alreadyExists = await this.userRepository.existsByEmail(email.value);
    if (alreadyExists) {
      throw new EmailAlreadyExistsException(email.value);
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    const user = User.create({
      id: uuid(),
      email,
      passwordHash,
      role: command.role,
    });

    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email.value,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
