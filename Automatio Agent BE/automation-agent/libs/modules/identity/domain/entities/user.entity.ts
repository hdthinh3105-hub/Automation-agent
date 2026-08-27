import { AggregateRoot } from '@app/shared/base/aggregate-root.base';
import { Role } from '@app/shared/types/role.enum';
import { AccountInactiveException } from '../exceptions/identity.exception';
import { UserLoggedInEvent } from '../events/user-logged-in.event';
import { Email } from '../value-objects/email.vo';

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 🔑 Aggregate Root — Identity Module (TDD Mục 5.1).
 * Owns the invariants around credentials/activation state; password
 * hashing itself is delegated to the `IPasswordHasher` port (Domain
 * doesn't know *how* hashing works, only that it needs a hash to store).
 */
export class User extends AggregateRoot<string> {
  private props: UserProps;

  private constructor(props: UserProps) {
    super(props.id);
    this.props = props;
  }

  public static create(params: {
    id: string;
    email: Email;
    passwordHash: string;
    role: Role;
  }): User {
    const now = new Date();
    return new User({
      id: params.id,
      email: params.email,
      passwordHash: params.passwordHash,
      role: params.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  public get email(): Email {
    return this.props.email;
  }

  public get passwordHash(): string {
    return this.props.passwordHash;
  }

  public get role(): Role {
    return this.props.role;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public assertCanLogin(): void {
    if (!this.props.isActive) {
      throw new AccountInactiveException();
    }
  }

  public recordSuccessfulLogin(ipAddress?: string): void {
    this.addDomainEvent(new UserLoggedInEvent(this.id, this.props.email.value, ipAddress));
  }

  public changePasswordHash(newHash: string): void {
    this.props.passwordHash = newHash;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }
}
