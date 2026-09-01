'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { apiFetch, buildQueryString, ApiError } from '@/lib/api-client';
import { AuditLogItem, PaginatedResult } from '@/lib/types';
import { Card, PageHeader, Button, Spinner, EmptyState } from '@/components/ui';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditLogsPage() {
  const [result, setResult] = useState<PaginatedResult<AuditLogItem> | null>(null);
  const [resourceType, setResourceType] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const qs = buildQueryString({ resourceType, page, limit: 20 });
      const data = await apiFetch<PaginatedResult<AuditLogItem>>(`/admin/audit-logs${qs}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được audit log.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType, page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Toàn bộ sự kiện thay đổi tài nguyên trong hệ thống (chỉ Admin)."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
            <History className="h-3.5 w-3.5" /> {result?.meta.totalItems ?? 0} sự kiện
          </span>
        }
      />

      <select
        value={resourceType}
        onChange={(e) => {
          setResourceType(e.target.value);
          setPage(1);
        }}
        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      >
        <option value="">Mọi loại tài nguyên</option>
        {['Ticket', 'Escalation', 'KnowledgeDocument', 'User', 'Unknown'].map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-gray-500">
          <Spinner /> Đang tải...
        </div>
      ) : result?.items.length === 0 ? (
        <EmptyState title="Chưa có audit log nào" description="Các sự kiện thay đổi tài nguyên sẽ hiển thị ở đây." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-surface-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Hành động</th>
                  <th className="px-5 py-3">Tài nguyên</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Thay đổi</th>
                </tr>
              </thead>
              <tbody>
                {result?.items.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-surface-50/60">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-500">{formatDate(log.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-lg bg-gray-100 px-2 py-0.5 font-mono text-xs font-medium text-gray-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {log.resourceType}
                      <span className="ml-1 font-mono text-xs text-gray-400">#{log.resourceId.slice(0, 8)}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {log.actorType}
                      {log.actorId ? (
                        <span className="ml-1 font-mono text-xs text-gray-400">#{log.actorId.slice(0, 8)}</span>
                      ) : null}
                    </td>
                    <td className="max-w-xs px-5 py-3">
                      {log.changesJson ? (
                        <details>
                          <summary className="cursor-pointer text-xs font-medium text-brand-600 hover:underline">
                            Xem chi tiết
                          </summary>
                          <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-surface-50 p-2 text-[10px] text-gray-600">
                            {JSON.stringify(log.changesJson, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {result && result.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Trang {result.meta.page} / {result.meta.totalPages} · {result.meta.totalItems} sự kiện
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Trước
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= result.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}