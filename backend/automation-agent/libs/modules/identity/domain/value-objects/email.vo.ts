import { ValueObject } from '@app/shared/base/entity.base';

interface EmailProps extends Record<string, unknown> {
  value: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Immutable, self-validating Email VO (TDD Mục 2.3 — "Email").
 * Normalizes to lowercase/trimmed so equality/uniqueness checks are
 * consistent regardless of how the caller typed it.
 */
export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(raw: string): Email {
    const value = raw?.trim().toLowerCase();
    if (!value || !EMAIL_REGEX.test(value)) {
      throw new Error(`Invalid email address: "${raw}"`);
    }
    return new Email({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}
