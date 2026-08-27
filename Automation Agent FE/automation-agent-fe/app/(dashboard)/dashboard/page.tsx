'use client';

import { useEffect, useState } from 'react';
import {
  Ticket as TicketIcon,
  Bot,
  ArrowUpRight,
  Gauge,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { apiFetch, ApiError } from '@/lib/api-client';
import { OverviewStats, TrendPoint, AiPerformanceStats } from '@/lib/types';
import { MetricCard } from '@/components/metric-card';
import { Card, PageHeader, Spinner } from '@/components/ui';
import { getStatusLabel, getPriorityLabel } from '@/components/status-badge';

const STATUS_COLORS = [
  '#94a3b8',
  '#3b82f6',
  '#eab308',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#14b8a6',
  '#64748b',
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#3b82f6',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function DashboardOverviewPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [aiPerformance, setAiPerformance] = useState<AiPerformanceStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [overviewData, trendsData] = await Promise.all([
          apiFetch<OverviewStats>('/dashboard/overview'),
          apiFetch<TrendPoint[]>('/dashboard/trends'),
        ]);
        if (cancelled) return;
        setOverview(overviewData);
        setTrends(trendsData);

        try {
          const aiData = await apiFetch<AiPerformanceStats>('/dashboard/ai-performance');
          if (!cancelled) setAiPerformance(aiData);
        } catch {
          // Agent không phải Admin sẽ nhận 403 — bỏ qua.
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Không tải được dữ liệu Dashboard.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-gray-500">
        <Spinner /> Đang tải dữ liệu...
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }

  const statusData = overview
    ? Object.entries(overview.byStatus).map(([status, count]) => ({
        name: getStatusLabel(status),
        value: count,
      }))
    : [];

  const priorityData = overview
    ? Object.entries(overview.byPriority).map(([priority, count]) => ({
        name: getPriorityLabel(priority),
        value: count,
        color: PRIORITY_COLORS[priority] ?? '#94a3b8',
      }))
    : [];

  const trendData = trends.map((t) => ({
    ...t,
    shortDate: formatDateShort(t.date),
    autoRate: t.totalTickets > 0 ? Math.round((t.autoResolvedCount / t.totalTickets) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan hệ thống"
        description="Số liệu vận hành theo thời gian thực"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Tổng ticket"
          value={overview?.totalTickets.toString() ?? '—'}
          icon={<TicketIcon className="h-5 w-5" />}
        />
        <MetricCard
          label="AI tự trả lời"
          value={overview ? formatPercent(overview.autoResolveRate) : '—'}
          icon={<Bot className="h-5 w-5" />}
          accent="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <MetricCard
          label="Chuyển Agent"
          value={overview ? formatPercent(overview.escalationRate) : '—'}
          icon={<ArrowUpRight className="h-5 w-5" />}
          accent="text-amber-600"
          iconBg="bg-amber-50"
        />
        <MetricCard
          label="Confidence TB"
          value={
            aiPerformance?.avgConfidence != null ? aiPerformance.avgConfidence.toFixed(2) : '—'
          }
          icon={<Gauge className="h-5 w-5" />}
          sub={aiPerformance ? `${formatPercent(aiPerformance.autoResolveRate)} auto-resolve` : undefined}
          accent="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>

      <Card title="Xu hướng 30 ngày gần nhất" subtitle="Số ticket theo ngày và tỷ lệ AI trả lời">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="total" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2f59c4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2f59c4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="auto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="shortDate" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
              />
              <Area type="monotone" dataKey="totalTickets" name="Tổng ticket" stroke="#2f59c4" strokeWidth={2} fill="url(#total)" />
              <Area type="monotone" dataKey="autoResolvedCount" name="AI trả lời" stroke="#10b981" strokeWidth={2} fill="url(#auto)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Ticket theo trạng thái" subtitle="Phân bố trạng thái hiện tại">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={82}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Ticket theo mức ưu tiên" subtitle="Tập trung vào các yêu cầu quan trọng">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ top: 8, right: 8, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="value" name="Số ticket" radius={[0, 6, 6, 0]} barSize={22}>
                  {priorityData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          AI đang tự động phân loại, trả lời và theo dõi SLA cho mọi ticket mới.
        </div>
      </div>
    </div>
  );
}