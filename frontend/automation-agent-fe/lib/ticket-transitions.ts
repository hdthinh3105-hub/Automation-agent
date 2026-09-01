/**
 * Ma trận transition hợp lệ — COPY Y NGUYÊN từ backend
 * `libs/modules/ticket/domain/value-objects/ticket-status.vo.ts` (TDD
 * Mục 9). Giữ đồng bộ 2 bên: FE chỉ dùng để UX tốt hơn (không cho bấm
 * transition sai), backend vẫn là nơi validate thật sự (409 nếu FE lỡ
 * gửi sai do code 2 bên lệch nhau).
 */
export const VALID_TICKET_TRANSITIONS: Record<string, string[]> = {
  NEW: ['CLASSIFIED', 'ESCALATED'],
  CLASSIFIED: ['WAITING_CUSTOMER', 'ANSWERED', 'ESCALATED'],
  WAITING_CUSTOMER: ['CLASSIFIED', 'ESCALATED'],
  ANSWERED: ['RESOLVED', 'ESCALATED'],
  ESCALATED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED', 'ESCALATED'],
  RESOLVED: ['CLOSED', 'ESCALATED'],
  CLOSED: [],
};

export function getValidNextStatuses(currentStatus: string): string[] {
  return VALID_TICKET_TRANSITIONS[currentStatus] ?? [];
}