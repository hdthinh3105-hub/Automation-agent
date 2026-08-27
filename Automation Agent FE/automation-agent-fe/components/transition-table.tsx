import { VALID_TICKET_TRANSITIONS } from '@/lib/ticket-transitions';
import { StatusBadge } from './status-badge';

/**
 * Hiển thị nguyên bảng ma trận transition (TDD Mục 9) — dòng ứng với
 * trạng thái hiện tại của ticket được highlight, giúp Agent biết ngay
 * "từ đây đi được đâu" thay vì đoán rồi ăn lỗi 409.
 */
export default function TransitionTable({ currentStatus }: { currentStatus: string }) {
  const rows = Object.entries(VALID_TICKET_TRANSITIONS);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-gray-200 text-[10px] uppercase text-gray-400">
            <th className="py-2 pr-3">Từ trạng thái</th>
            <th className="py-2">Được chuyển sang</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([from, tos]) => {
            const isCurrent = from === currentStatus;
            return (
              <tr
                key={from}
                className={`border-b border-gray-100 last:border-0 ${
                  isCurrent ? 'bg-brand-50/60' : ''
                }`}
              >
                <td className="py-2 pr-3 align-top">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={from} />
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-brand-600">← hiện tại</span>
                    )}
                  </div>
                </td>
                <td className="py-2 align-top">
                  {tos.length === 0 ? (
                    <span className="text-gray-400">— (trạng thái cuối, không chuyển đi đâu được)</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tos.map((to) => (
                        <StatusBadge key={to} status={to} />
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}