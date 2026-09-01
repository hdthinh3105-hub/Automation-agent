'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { apiFetch, buildQueryString, ApiError } from '@/lib/api-client';
import { TicketListItem, PaginatedResult, TICKET_STATUSES, PRIORITY_LEVELS } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import { Card, PageHeader, Button, Spinner, EmptyState, inputClass } from '@/components/ui';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const CHANNEL_LABEL: Record<string, string> = {
  WEB: 'Web',
  TELEGRAM: 'Telegram',
  EMAIL: 'Email',
};

export default function TicketListPage() {
  const [result, setResult] = useState<PaginatedResult<TicketListItem> | null>(null);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const qs = buildQueryString({ status, priority, page, limit: 20 });
        const data = await apiFetch<PaginatedResult<TicketListItem>>(`/tickets${qs}`);
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Không tải được danh sách ticket.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, priority, page]);

  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  const filteredItems = result?.items.filter((t) =>
    query
      ? t.subject.toLowerCase().includes(query.toLowerCase()) ||
        t.customerEmail.toLowerCase().includes(query.toLowerCase())
      : true,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh sách Ticket"
        description={result ? `${result.meta.totalItems} ticket` : 'Đang tải...'}
        action={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo chủ đề / email..."
              className={`${inputClass} w-64 pl-9`}
            />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => handleFilterChange(setStatus, e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Mọi trạng thái</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(e) => handleFilterChange(setPriority, e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Mọi mức ưu tiên</option>
          {PRIORITY_LEVELS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-gray-500">
          <Spinner /> Đang tải...
        </div>
      ) : filteredItems && filteredItems.length === 0 ? (
        <EmptyState title="Không có ticket nào" description="Không tìm thấy ticket khớp bộ lọc hiện tại." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-surface-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Chủ đề</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Kênh</th>
                  <th className="px-5 py-3">Ưu tiên</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">Tạo lúc</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems?.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-50 last:border-0 hover:bg-surface-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/tickets/${ticket.id}`} className="font-medium text-brand-600 hover:underline">
                        {ticket.subject}
                      </Link>
                      {ticket.category && (
                        <span className="ml-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                          {ticket.category}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{ticket.customerEmail}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {CHANNEL_LABEL[ticket.channel] ?? ticket.channel}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-500">{formatDate(ticket.createdAt)}</td>
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
            Trang {result.meta.page} / {result.meta.totalPages} · {result.meta.totalItems} ticket
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