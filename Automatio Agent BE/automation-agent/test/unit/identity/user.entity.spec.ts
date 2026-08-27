import { Role } from '@app/shared/types/role.enum';
import { User } from '@app/modules/identity/domain/entities/user.entity';
import { Email } from '@app/modules/identity/domain/value-objects/email.vo';
import { AccountInactiveException } from '@app/modules/identity/domain/exceptions/identity.exception';

describe('User entity', () => {
  const buildUser = () =>
    User.create({
      id: 'user-1',
      email: Email.create('agent@example.com'),
      passwordHash: 'hashed',
      role: Role.AGENT,
    });

  it('creates an active user by default', () => {
    const user = buildUser();
    expect(user.isActive).toBe(true);
    expect(user.email.value).toBe('agent@example.com');
    expect(user.role).toBe(Role.AGENT);
  });

  it('allows login when active', () => {
    const user = buildUser();
    expect(() => user.assertCanLogin()).not.toThrow();
  });

  it('throws AccountInactiveException when deactivated user tries to login', () => {
    const user = buildUser();
    user.deactivate();
    expect(() => user.assertCanLogin()).toThrow(AccountInactiveException);
  });

  it('records a UserLoggedInEvent domain event on successful login', () => {
    const user = buildUser();
    user.recordSuccessfulLogin('127.0.0.1');
    expect(user.domainEvents).toHaveLength(1);
    expect(user.domainEvents[0].eventName).toBe('identity.user.logged_in');
    user.clearDomainEvents();
    expect(user.domainEvents).toHaveLength(0);
  });

  it('rejects an invalid email', () => {
    expect(() => Email.create('not-an-email')).toThrow();
  });
});
