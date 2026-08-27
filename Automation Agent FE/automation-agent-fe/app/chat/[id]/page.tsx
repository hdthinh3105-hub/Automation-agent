'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, Send, User, ArrowLeft } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { TicketPublicView } from '@/lib/types';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Đang tiếp nhận',
  CLASSIFIED: 'Đang phân loại',
  WAITING_CUSTOMER: 'Đang chờ bạn bổ sung thông tin',
  ANSWERED: 'Đã có câu trả lời',
  ESCALATED: 'Đã chuyển cho nhân viên hỗ trợ',
  IN_PROGRESS: 'Nhân viên đang xử lý',
  RESOLVED: 'Đã xử lý xong',
  CLOSED: 'Đã đóng',
};

const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-600',
  CLASSIFIED: 'bg-blue-50 text-blue-700',
  WAITING_CUSTOMER: 'bg-yellow-50 text-yellow-700',
  ANSWERED: 'bg-emerald-50 text-emerald-700',
  ESCALATED: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-violet-50 text-violet-700',
  RESOLVED: 'bg-teal-50 text-teal-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const SENDER_META: Record<string, { align: string; bubble: string; label: string; icon: 'bot' | 'user' }> = {
  CUSTOMER: { align: 'justify-end', bubble: 'rounded-br-md bg-brand-600 text-white', label: 'Bạn', icon: 'user' },
  AI: { align: 'justify-start', bubble: 'rounded-bl-md border border-gray-200 bg-white text-gray-800', label: 'Trợ lý AI', icon: 'bot' },
  AGENT: { align: 'justify-start', bubble: 'rounded-bl-md bg-violet-50 text-violet-900 border border-violet-100', label: 'Nhân viên hỗ trợ', icon: 'bot' },
};

const POLL_INTERVAL_MS = 4000;

export default function ChatConversationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketPublicView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showTyping, setShowTyping] = useState(false);

  async function fetchTicket(silent = false): Promise<void> {
    if (!silent) setIsLoading(true);
    try {
      const data = await apiFetch<TicketPublicView>(`/tickets/${params.id}/public`);
      setTicket(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được cuộc trò chuyện.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!params.id) return;
    fetchTicket();
    const interval = setInterval(() => fetchTicket(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages.length]);

  async function handleSend(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!draft.trim() || isSending) return;
    setIsSending(true);
    setError(null);
    setShowTyping(true);
    try {
      await apiFetch(`/tickets/${params.id}/messages`, {
        method: 'POST',
        body: { content: draft.trim() },
      });
      setDraft('');
      await fetchTicket(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được tin nhắn.');
    } finally {
      setIsSending(false);
      setShowTyping(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!ticket) return null;

  const statusMeta = {
    label: STATUS_LABELS[ticket.status] ?? ticket.status,
    cls: STATUS_STYLE[ticket.status] ?? 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/chat')}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="max-w-[200px] truncate text-sm font-bold text-gray-900">{ticket.subject}</p>
              <span className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusMeta.cls}`}>
                {statusMeta.label}
              </span>
            </div>
          </div>
          <Link href="/" className="text-xs font-medium text-gray-400 transition hover:text-gray-600">
            Trang chủ
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {ticket.messages.map((msg) => {
            const meta = SENDER_META[msg.sender] ?? { align: 'justify-start', bubble: 'rounded-bl-md bg-white', label: msg.sender, icon: 'bot' };
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${meta.align}`}>
                {meta.icon === 'bot' ? (
                  <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100">
                    <Bot className="h-4 w-4 text-brand-600" />
                  </span>
                ) : (
                  <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-4 w-4 text-gray-500" />
                  </span>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${meta.bubble}`}>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase opacity-60">{meta.label}</p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {showTyping && (
            <div className="flex items-end gap-2 justify-start">
              <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100">
                <Bot className="h-4 w-4 text-brand-600" />
              </span>
              <div className="flex gap-1 rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.3s]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-2 mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-card">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-xl border-0 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={isSending || !draft.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}