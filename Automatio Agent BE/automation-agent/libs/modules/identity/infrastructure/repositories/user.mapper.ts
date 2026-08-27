import { User as PrismaUser, Role as PrismaRole } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Role } from '@app/shared/types/role.enum';

/**
 * Keeps Prisma's generated shape out of the Domain layer — the Domain
 * only ever sees `User` (the entity), never `PrismaUser`.
 *
 * Prisma generates its own `$Enums.Role` from `schema.prisma`, which is a
 * *structurally identical but nominally different* type from the Domain's
 * `Role` enum (`libs/shared/types/role.enum.ts`). TypeScript treats them as
 * incompatible even though the underlying string values match, so this
 * mapper is the ONLY place allowed to know about both sides and convert
 * between them explicitly (Dependency Inversion — see TDD Mục 2.2).
 *
 * `toDomainRole` also guards against the two enums silently drifting apart
 * in the future (e.g. a new role added in `schema.prisma` but forgotten in
 * the shared enum) by throwing instead of producing a bad cast.
 */
function toDomainRole(prismaRole: PrismaRole): Role {
  const value = prismaRole as string;
  if (!Object.values(Role).includes(value as Role)) {
    throw new Error(`Unknown role value from DB: ${value}`);
  }
  return value as Role;
}

function toPrismaRole(role: Role): PrismaRole {
  return role as unknown as PrismaRole;
}

export class UserMapper {
  static toDomain(record: PrismaUser): User {
    return User.reconstitute({
      id: record.id,
      email: Email.create(record.email),
      passwordHash: record.passwordHash,
      role: toDomainRole(record.role),
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(user: User): {
    id: string;
    email: string;
    passwordHash: string;
    role: PrismaRole;
    isActive: boolean;
  } {
    return {
      id: user.id,
      email: user.email.value,
      passwordHash: user.passwordHash,
      role: toPrismaRole(user.role),
      isActive: user.isActive,
    };
  }
}
