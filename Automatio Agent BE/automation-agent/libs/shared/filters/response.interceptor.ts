import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse, ok } from '../types/api-response';

/**
 * Wraps every successful controller return value into the standard
 * `{ success: true, data, error: null }` envelope, so controllers can
 * just `return dto` without manually building the envelope every time.
 * Errors are handled separately by GlobalExceptionFilter.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(map((data) => ok(data)));
  }
}
