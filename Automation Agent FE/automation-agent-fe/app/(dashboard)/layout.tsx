'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  ArrowUpRight,
  BookOpen,
  FlaskConical,
  Users,
  ScrollText,
  LogOut,
  Bot,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const VIEWER_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/tickets', label: 'Ticket', icon: TicketIcon },
];

const STAFF_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/tickets', label: 'Ticket', icon: TicketIcon },
  { href: '/escalations', label: 'Escalation', icon: ArrowUpRight },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/rag', label: 'Test RAG', icon: FlaskConical },
];

const ADMIN_NAV: NavItem[] = [
  ...STAFF_NAV,
  { href: '/users', label: 'Người dùng', icon: Users },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
];

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  AGENT: 'Nhân viên hỗ trợ',
  VIEWER: 'Người xem',
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = user?.role === 'ADMIN' ? ADMIN_NAV : user?.role === 'AGENT' ? STAFF_NAV : VIEWER_NAV;

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-50">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Bot className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">AI Support</p>
            <p className="truncate text-[11px] text-gray-400">Trung tâm điều hành</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] ${active ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {user.email.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
              <p className="text-[11px] text-gray-400">{ROLE_LABEL[user.role] ?? user.role}</p>
            </div>
            <button
              onClick={logout}
              title="Đăng xuất"
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white/80 px-8 backdrop-blur">
          <p className="text-sm text-gray-500">
            {navItems.find((i) => isActive(pathname, i.href))?.label ?? 'Đang làm việc'}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Hệ thống đang chạy
            </span>
          </div>
        </header>

        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}