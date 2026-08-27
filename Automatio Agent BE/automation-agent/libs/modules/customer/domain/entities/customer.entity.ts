import { Entity } from '@app/shared/base/entity.base';

export interface CustomerProps {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  firstSeenAt: Date;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 🔑 Aggregate Root — Customer Module (TDD Mục 5.2).
 * Không cần đăng nhập — định danh qua email. Không dùng chung Email VO
 * của Identity Module (ranh giới module — mỗi module tự validate dữ
 * liệu của mình, TDD Mục 2.4: "Không cho phép module A import thẳng
 * Repository/Entity nội bộ của module B").
 */
export class Customer extends Entity<string> {
  private props: CustomerProps;

  private constructor(props: CustomerProps) {
    super(props.id);
    this.props = props;
  }

  public static create(params: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
  }): Customer {
    const email = params.email?.trim().toLowerCase();
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new Error(`Invalid customer email: "${params.email}"`);
    }
    return new Customer({
      id: params.id,
      email,
      name: params.name ?? null,
      phone: params.phone ?? null,
      metadata: null,
      firstSeenAt: new Date(),
    });
  }

  public static reconstitute(props: CustomerProps): Customer {
    return new Customer(props);
  }

  public get email(): string {
    return this.props.email;
  }

  public get name(): string | null {
    return this.props.name;
  }

  public get phone(): string | null {
    return this.props.phone;
  }

  public get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  public get firstSeenAt(): Date {
    return this.props.firstSeenAt;
  }
}
