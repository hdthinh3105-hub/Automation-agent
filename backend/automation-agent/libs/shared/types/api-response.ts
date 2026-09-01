/**
 * Standard response envelope used across the whole REST API
 * (see TDD Mục 11 — "mọi response bọc trong envelope { success, data, error, meta }").
 */
export interface ApiErrorShape {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  error: null;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: ApiErrorShape;
  meta?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccessResponse<T> {
  return { success: true, data, error: null, meta };
}
