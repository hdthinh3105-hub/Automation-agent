import { Injectable } from '@nestjs/common';
import { Role as PrismaRole } from '@prisma/client';
import { PrismaService } from '@app/infrastructure/prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../application/ports/repository.ports';
import { UserMapper } from './user.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.user.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role as PrismaRole,
        isActive: data.isActive,
      },
      update: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role as PrismaRole,
        isActive: data.isActive,
      },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  async list(params: {
    page: number;
    limit: number;
    role?: string;
  }): Promise<{ items: User[]; totalItems: number }> {
    const where = params.role ? { role: params.role as PrismaRole } : {};
    const [records, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: records.map(UserMapper.toDomain), totalItems };
  }
}
