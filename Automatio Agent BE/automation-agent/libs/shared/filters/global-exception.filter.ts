import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';
import { ErrorCode, ERROR_CODE_HTTP_STATUS } from '../exceptions/error-codes';
import { ApiErrorResponse } from '../types/api-response';

/**
 * Single place where any thrown error (Domain exception, Nest HttpException,
 * or unexpected runtime error) is normalized into the standard
 * `{ success, data, error, meta }` envelope described in TDD Mục 11.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.resolve(exception, request);

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} -> ${status} ${body.error.code}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(body);
  }

  private resolve(
    exception: unknown,
    request: Request,
  ): { status: number; body: ApiErrorResponse } {
    // 1) Domain exceptions raised from Application/Domain layer use cases.
    if (exception instanceof DomainException) {
      const status = ERROR_CODE_HTTP_STATUS[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return {
        status,
        body: {
          success: false,
          data: null,
          error: {
            code: exception.code,
            message: exception.message,
            details: exception.details,
          },
          meta: { path: request.url },
        },
      };
    }

    // 2) Nest's own HttpException (ValidationPipe errors, guards, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as Record<string, unknown>).message ?? exception.message);
      const details =
        typeof res === 'object' && res !== null ? (res as Record<string, unknown>) : undefined;

      return {
        status,
        body: {
          success: false,
          data: null,
          error: {
            code: this.mapHttpStatusToCode(status),
            message: Array.isArray(message) ? message.join('; ') : String(message),
            details,
          },
          meta: { path: request.url },
        },
      };
    }

    // 3) Unknown/unexpected error — never leak internals to the client.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        data: null,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred',
        },
        meta: { path: request.url },
      },
    };
  }

  private mapHttpStatusToCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.UNPROCESSABLE_ENTITY:
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}
