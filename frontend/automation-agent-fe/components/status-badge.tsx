const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  NEW: { label: 'Mới', cls: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  CLASSIFIED: { label: 'Đã phân loại', cls: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  WAITING_CUSTOMER: { label: 'Chờ khách bổ sung', cls: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-500' },
  ANSWERED: { label: 'AI đã trả lời', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  ESCALATED: { label: 'Đã chuyển Agent', cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  IN_PROGRESS: { label: 'Agent đang xử lý', cls: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  RESOLVED: { label: 'Đã xử lý xong', cls: 'bg-teal-50 text-teal-700', dot: 'bg-teal-500' },
  CLOSED: { label: 'Đã đóng', cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-500' },
};

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  LOW: { label: 'Thấp', cls: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Trung bình', cls: 'bg-blue-50 text-blue-700' },
  HIGH: { label: 'Cao', cls: 'bg-orange-50 text-orange-700' },
  URGENT: { label: 'Khẩn cấp', cls: 'bg-red-50 text-red-700' },
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return <span className="text-xs text-gray-400">—</span>;
  const meta = PRIORITY_META[priority] ?? { label: priority, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export const STATUS_ORDER = ['NEW', 'CLASSIFIED', 'WAITING_CUSTOMER', 'ANSWERED', 'ESCALATED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export function getStatusLabel(status: string): string {
  return STATUS_META[status]?.label ?? status;
}
export function getPriorityLabel(priority: string): string {
  return PRIORITY_META[priority]?.label ?? priority;
}