'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bot, User, Headset, AlertTriangle, RotateCcw } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { TicketDetail } from '@/lib/types';
import { getValidNextStatuses } from '@/lib/ticket-transitions';
import { StatusBadge, PriorityBadge, getStatusLabel } from '@/components/status-badge';
import { Card, PageHeader, Button, Spinner, inputClass } from '@/components/ui';
import TransitionTable from '@/components/transition-table';
import { useAuth } from '@/lib/auth-context';

const ESCALATION_REASONS = ['LOW_CONFIDENCE', 'EXPLICIT_REQUEST', 'POLICY_RULE', 'COMPLEX_CASE'];

const ESCALATION_REASON_LABEL: Record<string, string> = {
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

const SENDER_META: Record<string, { cls: string; label: string; icon: 'user' | 'ai' | 'agent' }> = {
  CUSTOMER: { cls: 'bg-surface-50 border border-gray-200', label: 'Khách hàng', icon: 'user' },
  AGENT: { cls: 'bg-violet-50 border border-violet-100', label: 'Agent', icon: 'agent' },
  AI: { cls: 'bg-emerald-50 border border-emerald-100', label: 'AI', icon: 'ai' },
};

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [reason, setReason] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);

  const canAct = user?.role === 'AGENT' || user?.role === 'ADMIN';

  async function loadTicket() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<TicketDetail>(`/tickets/${params.id}`);
      setTicket(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được chi tiết ticket.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleStatusUpdate(): Promise<void> {
    if (!nextStatus) return;
    setIsUpdating(true);
    setError(null);
    try {
      await apiFetch(`/tickets/${params.id}/status`, {
        method: 'PATCH',
        body: { status: nextStatus, reason: reason || undefined },
      });
      setNextStatus('');
      setReason('');
      await loadTicket();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không đổi được trạng thái ticket.');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleEscalate(): Promise<void> {
    if (!escalationReason) return;
    setIsEscalating(true);
    setError(null);
    try {
      await apiFetch('/escalations', {
        method: 'POST',
        body: { ticketId: ticket?.id, reason: escalationReason },
      });
      setEscalationReason('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể chuyển ticket cho Agent.');
    } finally {
      setIsEscalating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-gray-500">
        <Spinner /> Đang tải...
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push('/tickets')} className="text-sm text-brand-600 hover:underline">
          ← Quay lại danh sách
        </button>
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!ticket) return null;

  const validNextStatuses = getValidNextStatuses(ticket.status);
  const alreadyEscalated = ticket.status === 'ESCALATED' || ticket.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push('/tickets')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </button>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">{ticket.subject}</h1>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          {ticket.isSpam && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              <AlertTriangle className="h-3 w-3" /> SPAM
            </span>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card title="Thông tin ticket">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-500">Khách hàng</dt>
                <dd className="truncate text-right font-medium text-gray-900">{ticket.customerEmail}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Kênh</dt>
                <dd className="font-medium text-gray-900">{ticket.channel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Danh mục</dt>
                <dd className="font-medium text-gray-900">{ticket.category ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Confidence</dt>
                <dd className="font-medium text-gray-900">
                  {ticket.confidenceScore !== null ? ticket.confidenceScore.toFixed(2) : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Tạo lúc</dt>
                <dd className="font-medium text-gray-900">{formatDate(ticket.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Cập nhật</dt>
                <dd className="font-medium text-gray-900">{formatDate(ticket.updatedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Xử lý xong</dt>
                <dd className="font-medium text-gray-900">{formatDate(ticket.resolvedAt)}</dd>
              </div>
            </dl>

            {ticket.missingInfoFlags.length > 0 && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Thiếu thông tin: {ticket.missingInfoFlags.join(', ')}
              </div>
            )}
          </Card>

          {canAct && (
            <Card title="Đổi trạng thái">
              {validNextStatuses.length === 0 ? (
                <p className="rounded-xl bg-surface-50 px-3 py-2.5 text-xs text-gray-500">
                  Ticket đã ở trạng thái cuối (CLOSED) — không thể chuyển tiếp.
                </p>
              ) : (
                <div className="space-y-3">
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Chọn trạng thái mới</option>
                    {validNextStatuses.map((s) => (
                      <option key={s} value={s}>
                        {getStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Lý do (tuỳ chọn)"
                    className={inputClass}
                  />
                  <Button onClick={handleStatusUpdate} disabled={!nextStatus || isUpdating} className="w-full">
                    {isUpdating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {canAct && (
            <Card title="Chuyển cho Agent">
              {alreadyEscalated ? (
                <p className="rounded-xl bg-surface-50 px-3 py-2.5 text-xs text-gray-500">
                  Ticket này đã được chuyển xử lý bởi con người.
                </p>
              ) : (
                <div className="space-y-3">
                  <select
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Chọn lý do chuyển</option>
                    {ESCALATION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {ESCALATION_REASON_LABEL[r] ?? r}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    onClick={handleEscalate}
                    disabled={!escalationReason || isEscalating}
                    className="w-full border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  >
                    {isEscalating ? 'Đang chuyển...' : 'Chuyển cho Agent'}
                  </Button>
                </div>
              )}
            </Card>
          )}

          <Card title="Ma trận chuyển trạng thái" subtitle="Các transition hợp lệ theo State Machine">
            <TransitionTable currentStatus={ticket.status} />
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Hội thoại">
            {ticket.messages.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có tin nhắn.</p>
            ) : (
              <div className="space-y-3">
                {ticket.messages.map((msg) => {
                  const meta = SENDER_META[msg.sender] ?? { cls: 'bg-surface-50 border border-gray-200', label: msg.sender, icon: 'ai' };
                  return (
                    <div key={msg.id} className={`flex items-start gap-3 rounded-xl p-3 ${meta.cls}`}>
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                        {meta.icon === 'user' ? (
                          <User className="h-3.5 w-3.5 text-gray-500" />
                        ) : meta.icon === 'agent' ? (
                          <Headset className="h-3.5 w-3.5 text-violet-600" />
                        ) : (
                          <Bot className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-700">{meta.label}</span>
                          <span className="text-xs text-gray-400">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="Lịch sử chuyển trạng thái">
            {ticket.timeline.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có lịch sử.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-gray-200 pl-4">
                {ticket.timeline.map((entry, idx) => (
                  <li key={idx} className="relative">
                    <span className="absolute -left-[21px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-gray-100">
                      <RotateCcw className="h-2.5 w-2.5 text-brand-600" />
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <StatusBadge status={entry.fromStatus} />
                      <span className="text-gray-400">→</span>
                      <StatusBadge status={entry.toStatus} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {entry.changedBy} • {formatDate(entry.changedAt)}
                      {entry.reason ? ` • ${entry.reason}` : ''}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}