/**
 * Channel — TDD Mục 5.3 (Channel Adapter Pattern). 4 kênh tiếp nhận:
 * Web (Must have), Chat App/Telegram (Should have), Email/Internal
 * (Could have — Phase này chỉ Web được implement thật).
 */
export enum Channel {
  WEB = 'WEB',
  EMAIL = 'EMAIL',
  CHAT_APP = 'CHAT_APP',
  INTERNAL = 'INTERNAL',
}
