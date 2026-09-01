/**
 * Result<TValue, TError> — lightweight Either-style type.
 *
 * Used in Application layer Use Cases for *expected* business outcomes
 * (e.g. "email already exists", "invalid credentials") so callers are
 * forced to handle both branches instead of relying on thrown exceptions
 * for predictable control flow. Domain/unexpected errors still use
 * exceptions (see shared/exceptions).
 */
export class Result<TValue, TError = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: TValue,
    private readonly _error?: TError,
  ) {}

  public static ok<TValue, TError = Error>(value: TValue): Result<TValue, TError> {
    return new Result<TValue, TError>(true, value, undefined);
  }

  public static fail<TValue, TError = Error>(error: TError): Result<TValue, TError> {
    return new Result<TValue, TError>(false, undefined, error);
  }

  public get isSuccess(): boolean {
    return this._isSuccess;
  }

  public get isFailure(): boolean {
    return !this._isSuccess;
  }

  public get value(): TValue {
    if (!this._isSuccess) {
      throw new Error('Cannot get the value of a failed result. Check isSuccess first.');
    }
    return this._value as TValue;
  }

  public get error(): TError {
    if (this._isSuccess) {
      throw new Error('Cannot get the error of a successful result.');
    }
    return this._error as TError;
  }
}
