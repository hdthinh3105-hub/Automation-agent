import { DomainException } from '@app/shared/exceptions/domain.exception';
import { ErrorCode } from '@app/shared/exceptions/error-codes';

export class CustomerNotFoundException extends DomainException {
  constructor(id: string) {
    super(ErrorCode.CUSTOMER_NOT_FOUND, `Customer with id "${id}" was not found`, { id });
  }
}
