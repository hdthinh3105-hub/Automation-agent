'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

/**
 * Landing page công khai cho KHÁCH HÀNG. Trước đây `/` redirect khách chưa
 * đăng nhập sang `/login` (trang quản trị) — buộc phải chỉ thẳng link `/chat`
 * cho khách. Giờ `/` hiển thị trang chào + CTA chat nổi bật; chỉ redirect vào
 * `/dashboard` khi đã là agent/admin.
 */
export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) router.replace('/dashboard');
  }, [isLoading, user, router]);

  if (isLoading || user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              A
            </span>
            <span className="text-sm font-semibold text-gray-900">AI Customer Support</span>
          </div>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Đăng nhập nhân viên
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Trợ lý AI hỗ trợ khách hàng 24/7
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-600">
            Bạn có thắc mắc về sản phẩm, chính sách đổi trả hay cần hỗ trợ? Gửi câu hỏi ngay, trợ lý
            AI sẽ trả lời tức thì và chuyển cho nhân viên khi cần.
          </p>
          <Link
            href="/chat"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Đặt câu hỏi ngay
          </Link>
          <p className="mt-4 text-xs text-gray-400">Miễn phí, không cần tài khoản</p>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-4">
        <p className="text-center text-xs text-gray-400">© 2026 AI Customer Support</p>
      </footer>
    </div>
  );
}