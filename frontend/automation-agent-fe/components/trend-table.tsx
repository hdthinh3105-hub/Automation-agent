import { TrendPoint } from '@/lib/types';

export default function TrendTable({ trends }: { trends: TrendPoint[] }) {
  if (trends.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Chưa có dữ liệu — Analytics Worker tính snapshot mỗi ngày lúc 00:05, quay lại sau khi có dữ liệu
        ngày hôm qua trở đi.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
            <th className="py-2 pr-4">Ngày</th>
            <th className="py-2 pr-4">Tổng ticket</th>
            <th className="py-2 pr-4">AI tự trả lời</th>
            <th className="py-2 pr-4">Escalate</th>
            <th className="py-2 pr-4">Confidence TB</th>
          </tr>
        </thead>
        <tbody>
          {trends.map((point) => (
            <tr key={point.date} className="border-b border-gray-100 last:border-0">
              <td className="py-2 pr-4 text-gray-900">{point.date}</td>
              <td className="py-2 pr-4">{point.totalTickets}</td>
              <td className="py-2 pr-4 text-green-600">{point.autoResolvedCount}</td>
              <td className="py-2 pr-4 text-amber-600">{point.escalatedCount}</td>
              <td className="py-2 pr-4">{point.avgConfidence?.toFixed(2) ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}