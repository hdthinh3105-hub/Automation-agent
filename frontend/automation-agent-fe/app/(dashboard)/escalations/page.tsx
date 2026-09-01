'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, Inbox } from 'lucide-react';
import { apiFetch, buildQueryString, ApiError } from '@/lib/api-client';
import { EscalationItem, PaginatedResult, ESCALATION_STATUSES } from '@/lib/types';
import { Card, PageHeader, Button, Spinner, EmptyState, inputClass } from '@/components/ui';

const ESC_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang chờ xử lý',
  ACKNOWLEDGED: 'Agent đã nhận',
  RESOLVED: 'Đã xử lý xong',
};

const ESC_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  ACKNOWLEDGED: 'bg-blue-50 text-blue-700',
  RESOLVED: 'bg-emerald-50 text-emerald-700',
};

const ESC_REASON_LABEL: Record<string, string> = {
  LOW_CONFIDENCE: 'AI không chắc chắn',
  EXPLICIT_REQUEST: 'Khách yêu cầu gặp người',
  POLICY_RULE: 'Theo quy định',
  COMPLEX_CASE: 'Ca phức tạp',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isOverdue(deadline: string, status: string): boolean {
  return status !== 'RESOLVED' && new Date(deadline).getTime() < Date.now();
}

export default function EscalationsPage() {
  const [result, setResult] = useState<PaginatedResult<EscalationItem> | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const qs = buildQueryString({ status, page, limit: 20 });
      const data = await apiFetch<PaginatedResult<EscalationItem>>(`/escalations${qs}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách escalation.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  async function handleAcknowledge(id: string): Promise<void> {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/escalations/${id}/acknowledge`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không nhận được escalation.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolve(id: string): Promise<void> {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/escalations/${id}/resolve`, {
        method: 'PATCH',
        body: { resolutionNote: resolveNote.trim() || undefined },
      });
      setResolveNote('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không giải quyết được escalation.');
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = result?.items.filter((e) => e.status === 'PENDING').length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escalation"
        description="Ticket được chuyển cho nhân viên hỗ trợ — theo dõi SLA và xử lý tại đây."
        action={
          pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" /> {pendingCount} đang chờ xử lý
            </span>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Mọi trạng thái</option>
          {ESCALATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ESC_STATUS_LABELS[s] ?? s}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-gray-500">
          <Spinner /> Đang tải...
        </div>
      ) : result?.items.length === 0 ? (
        <EmptyState title="Không có escalation nào" description="Không tìm thấy escalation khớp bộ lọc hiện tại." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-surface-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Lý do</th>
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">SLA hạn chót</th>
                  <th className="px-5 py-3">Ghi chú giải quyết</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {result?.items.map((esc) => (
                  <tr key={esc.id} className="border-b border-gray-50 last:border-0 hover:bg-surface-50/60">
                    <td className="px-5 py-3">
                      <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {ESC_REASON_LABEL[esc.reason] ?? esc.reason}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/tickets/${esc.ticketId}`} className="font-medium text-brand-600 hover:underline">
                        #{esc.ticketId.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ESC_STATUS_STYLES[esc.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {ESC_STATUS_LABELS[esc.status] ?? esc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-sm ${isOverdue(esc.slaDeadline, esc.status) ? 'font-medium text-red-600' : 'text-gray-600'}`}>
                        {isOverdue(esc.slaDeadline, esc.status) && <Clock className="h-3.5 w-3.5" />}
                        {formatDate(esc.slaDeadline)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {esc.status === 'RESOLVED' ? (
                        esc.resolutionNote || <span className="text-gray-400">—</span>
                      ) : (
                        <input
                          type="text"
                          value={resolveNote}
                          onChange={(e) => setResolveNote(e.target.value)}
                          placeholder="Ghi chú khi giải quyết"
                          className={inputClass}
                        />
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {esc.status === 'PENDING' && (
                        <Button size="sm" disabled={busyId === esc.id} onClick={() => handleAcknowledge(esc.id)}>
                          {busyId === esc.id ? 'Đang xử lý...' : 'Nhận ticket'}
                        </Button>
                      )}
                      {esc.status === 'ACKNOWLEDGED' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          disabled={busyId === esc.id}
                          onClick={() => handleResolve(esc.id)}
                        >
                          {busyId === esc.id ? 'Đang lưu...' : 'Xử lý xong'}
                        </Button>
                      )}
                      {esc.status === 'RESOLVED' && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Đã xong
                        </span>
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
            Trang {result.meta.page} / {result.meta.totalPages} · {result.meta.totalItems} escalation
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

      {pendingCount === 0 && result && result.items.length > 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800">
          <Inbox className="h-4 w-4" /> Không còn escalation nào đang chờ xử lý.
        </div>
      )}
    </div>
  );
}