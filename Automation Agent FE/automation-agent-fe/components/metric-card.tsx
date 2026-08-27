import { ReactNode } from 'react';

export function MetricCard({
  label,
  value,
  icon,
  accent = 'text-brand-600',
  sub,
  iconBg = 'bg-brand-50',
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: string;
  sub?: string;
  iconBg?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
          <p className={`mt-2 truncate text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <span className={accent}>{icon}</span>
        </span>
      </div>
    </div>
  );
}