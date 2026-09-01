'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setTokens, clearTokens, ApiError } from './api-client';
import { UserSummary } from './types';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: UserSummary;
}

interface AuthContextValue {
  user: UserSummary | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (raw && token) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        clearTokens();
      }
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const data = await apiFetch<TokenResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    router.push('/dashboard');
  }

  function logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      // best-effort — không chặn UI chờ kết quả
      apiFetch('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => undefined);
    }
    clearTokens();
    setUser(null);
    router.push('/');
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}

export { ApiError };