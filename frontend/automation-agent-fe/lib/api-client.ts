/**
 * API Client — bọc `fetch` để tự gắn Bearer token, tự parse envelope
 * chuẩn `{ success, data, error }` (TDD Mục 11), và tự thử refresh
 * token đúng 1 lần khi gặp 401 trước khi bắt buộc logout.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) return false;

    setTokens(body.data.accessToken, body.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  isRetry?: boolean;
}

/**
 * Hàm gọi API trung tâm — mọi page/hook trong Dashboard đều đi qua đây.
 * Ném `ApiError` khi `success: false`, ném `Error` thường khi network
 * fail hoàn toàn (không tới được server).
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isRetry = false } = options;
  const accessToken = getAccessToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 401 -> thử refresh đúng 1 lần rồi gọi lại request gốc.
  if (res.status === 401 && !isRetry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, isRetry: true });
    }
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError('UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn', 401);
  }

  const json = await res.json().catch(() => null);

  if (!json) {
    throw new Error(`Không đọc được phản hồi từ server (HTTP ${res.status})`);
  }

  if (!json.success) {
    const err: ApiErrorShape = json.error ?? { code: 'UNKNOWN', message: 'Đã có lỗi xảy ra' };
    throw new ApiError(err.code, err.message, res.status, err.details);
  }

  return json.data as T;
}

/**
 * Gọi API kèm `multipart/form-data` (upload file — Knowledge Base, TDD
 * Mục 5.5). Tương tự `apiFetch` nhưng không tự set `Content-Type` để
 * trình duyệt gắn multipart boundary; vẫn tự gắn Bearer token + xử lý
 * refresh khi 401.
 */
export async function apiFormFetch<T>(path: string, formData: FormData, isRetry = false): Promise<T> {
  const accessToken = getAccessToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: formData,
  });

  if (res.status === 401 && !isRetry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiFormFetch<T>(path, formData, true);
    }
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError('UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn', 401);
  }

  const json = await res.json().catch(() => null);

  if (!json) {
    throw new Error(`Không đọc được phản hồi từ server (HTTP ${res.status})`);
  }

  if (!json.success) {
    const err: ApiErrorShape = json.error ?? { code: 'UNKNOWN', message: 'Đã có lỗi xảy ra' };
    throw new ApiError(err.code, err.message, res.status, err.details);
  }

  return json.data as T;
}

export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}