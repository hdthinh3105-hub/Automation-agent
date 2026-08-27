'use client';

import { useEffect, useState, FormEvent } from 'react';
import { UserPlus, KeyRound, ShieldCheck } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { UserItem, PaginatedResult } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Card, PageHeader, Button, Spinner, EmptyState, inputClass, Field } from '@/components/ui';

const ROLE_META: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: 'Quản trị viên', cls: 'bg-violet-50 text-violet-700' },
  AGENT: { label: 'Nhân viên', cls: 'bg-brand-50 text-brand-700' },
  VIEWER: { label: 'Người xem', cls: 'bg-gray-100 text-gray-600' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [result, setResult] = useState<PaginatedResult<UserItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('AGENT');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function load() {
    if (!isAdmin) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<PaginatedResult<UserItem>>('/users?limit=100');
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function handleCreateUser(e: FormEvent): Promise<void> {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);
    try {
      await apiFetch<UserItem>('/users', {
        method: 'POST',
        body: { email, password, role },
      });
      setEmail('');
      setPassword('');
      setRole('AGENT');
      await load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Không tạo được tài khoản.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleChangePassword(e: FormEvent): Promise<void> {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);
    setIsChanging(true);
    try {
      await apiFetch('/users/me/password', {
        method: 'PATCH',
        body: { currentPassword, newPassword },
      });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMsg('Đổi mật khẩu thành công.');
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Không đổi được mật khẩu.');
    } finally {
      setIsChanging(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Người dùng &amp; tài khoản"
        description={isAdmin ? 'Quản lý nhân viên hỗ trợ và quyền truy cập.' : 'Đổi mật khẩu của bạn.'}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isAdmin && (
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                <UserPlus className="h-4 w-4 text-brand-600" />
              </span>
              <h2 className="text-sm font-semibold text-gray-900">Tạo tài khoản mới</h2>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <Field label="Email">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@example.com" className={inputClass} />
              </Field>
              <Field label="Mật khẩu">
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" className={inputClass} />
              </Field>
              <Field label="Vai trò">
                <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
                  <option value="AGENT">Nhân viên (AGENT)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  <option value="VIEWER">Người xem (VIEWER)</option>
                </select>
              </Field>
              {createError && (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{createError}</div>
              )}
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? 'Đang tạo...' : 'Tạo tài khoản'}
              </Button>
            </form>
          </Card>
        )}

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
              <KeyRound className="h-4 w-4 text-brand-600" />
            </span>
            <h2 className="text-sm font-semibold text-gray-900">Đổi mật khẩu của bạn</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <Field label="Mật khẩu hiện tại">
              <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
            </Field>
            <Field label="Mật khẩu mới">
              <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" className={inputClass} />
            </Field>
            {passwordMsg && (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{passwordMsg}</div>
            )}
            {passwordError && (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</div>
            )}
            <Button type="submit" disabled={isChanging} className="w-full">
              {isChanging ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </Button>
          </form>
        </Card>
      </div>

      {isAdmin && (
        <>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {isLoading ? (
            <div className="flex items-center gap-2 py-12 text-sm text-gray-500">
              <Spinner /> Đang tải...
            </div>
          ) : result?.items.length === 0 ? (
            <EmptyState title="Chưa có người dùng nào" />
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-gray-900">Danh sách người dùng</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-surface-50 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Vai trò</th>
                      <th className="px-5 py-3">Trạng thái</th>
                      <th className="px-5 py-3">Tạo lúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result?.items.map((u) => {
                      const roleMeta = ROLE_META[u.role] ?? { label: u.role, cls: 'bg-gray-100 text-gray-600' };
                      return (
                        <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-surface-50/60">
                          <td className="px-5 py-3 font-medium text-gray-900">{u.email}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleMeta.cls}`}>
                              {roleMeta.label}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Hoạt động
                              </span>
                            ) : (
                              <span className="text-gray-400">Không hoạt động</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}