'use client';

import { FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, Send, User, Home } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { TicketDetail } from '@/lib/types';

interface ChatBubble {
  id: string;
  role: 'bot' | 'customer';
  content: string;
}

/**
 * Web Chat — chat-first: khách mở trang là thấy khung chat + lời chào AI,
 * gõ câu hỏi luôn. Chỉ hỏi email khi gửi tin đầu tiên (BE yêu cầu
 * customerEmail/subject để tạo ticket). Tạo xong ticket thì chuyển sang
 * `/chat/[id]` để theo dõi câu trả lời.
 */
export default function ChatEntryPage() {
  const router = useRouter();
  const [bubbles, setBubbles] = useState<ChatBubble[]>([
    {
      id: 'welcome',
      role: 'bot',
      content:
        'Xin chào! Mình là trợ lý AI hỗ trợ khách hàng. Bạn có thắc mắc gì về sản phẩm, chính sách đổi trả hay bất kỳ vấn đề nào, cứ gõ ngay tại đây nhé.',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const firstMessageRef = useRef<string | null>(null);

  async function handleFirstMessage(content: string): Promise<void> {
    firstMessageRef.current = content;
    setBubbles((prev) => [...prev, { id: crypto.randomUUID(), role: 'customer', content }]);
    setDraft('');
    setNeedsEmail(true);
  }

  async function handleCreateTicket(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const ticket = await apiFetch<TicketDetail>('/tickets', {
        method: 'POST',
        body: {
          customerEmail,
          customerName: customerName || undefined,
          subject: firstMessageRef.current!.slice(0, 80),
          content: firstMessageRef.current!,
        },
      });
      router.push(`/chat/${ticket.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được yêu cầu. Vui lòng thử lại.');
      setIsSending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">Trợ lý AI hỗ trợ khách hàng</p>
              <p className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online · trả lời ngay
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            <Home className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {bubbles.map((b) => (
            <div key={b.id} className={`flex items-end gap-2 ${b.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
              {b.role === 'bot' && (
                <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100">
                  <Bot className="h-4 w-4 text-brand-600" />
                </span>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  b.role === 'customer'
                    ? 'rounded-br-md bg-brand-600 text-white'
                    : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{b.content}</p>
              </div>
              {b.role === 'customer' && (
                <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200">
                  <User className="h-4 w-4 text-gray-500" />
                </span>
              )}
            </div>
          ))}

          {needsEmail && (
            <form
              onSubmit={handleCreateTicket}
              className="flex justify-start"
              aria-label="Nhập email"
            >
              <div className="w-full max-w-md rounded-2xl rounded-bl-md border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  Gần xong rồi! Cho mình xin email để nhận câu trả lời nhé:
                </p>
                <div className="mt-3 space-y-2">
                  <input
                    type="email"
                    required
                    autoFocus
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="ban@example.com"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Họ tên (tuỳ chọn)"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={isSending || !customerEmail}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSending ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) handleFirstMessage(draft.trim());
          }}
          className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-card"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={needsEmail}
            placeholder={needsEmail ? 'Đã dừng — vui lòng nhập email ở trên' : 'Nhập câu hỏi của bạn...'}
            className="flex-1 rounded-xl border-0 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 disabled:bg-transparent disabled:text-gray-300"
          />
          <button
            type="submit"
            disabled={isSending || needsEmail || !draft.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-2 text-center text-[11px] text-gray-400">
          Trợ lý AI có thể trả lời tự động hoặc chuyển yêu cầu cho nhân viên hỗ trợ.
        </p>
      </div>
    </div>
  );
}