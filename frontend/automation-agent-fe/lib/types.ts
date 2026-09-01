export interface UserSummary {
  id: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'VIEWER';
}

export interface TicketListItem {
  id: string;
  customerId: string;
  customerEmail: string;
  channel: string;
  subject: string;
  status: string;
  category: string | null;
  priority: string | null;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessageItem {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
}

export interface TicketTimelineEntry {
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  reason: string | null;
  changedAt: string;
}

export interface TicketDetail extends TicketListItem {
  confidenceScore: number | null;
  isSpam: boolean;
  missingInfoFlags: string[];
  resolvedAt: string | null;
  messages: TicketMessageItem[];
  timeline: TicketTimelineEntry[];
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface OverviewStats {
  totalTickets: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  autoResolveRate: number;
  escalationRate: number;
}

export interface TrendPoint {
  date: string;
  totalTickets: number;
  autoResolvedCount: number;
  escalatedCount: number;
  avgConfidence: number | null;
}

export interface AiPerformanceStats {
  avgConfidence: number | null;
  autoResolveRate: number;
  escalationRate: number;
}

export const TICKET_STATUSES = [
  'NEW',
  'CLASSIFIED',
  'WAITING_CUSTOMER',
  'ANSWERED',
  'ESCALATED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export interface TicketPublicMessage {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
}

export interface TicketPublicView {
  id: string;
  subject: string;
  status: string;
  messages: TicketPublicMessage[];
}

export const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

// ---- Knowledge Base (Phase 5) ----
export const DOCUMENT_STATUSES = ['PENDING', 'PROCESSING', 'READY', 'FAILED'] as const;

export interface KnowledgeDocumentItem {
  id: string;
  title: string;
  status: string;
  version: number;
  tags: string[];
  createdAt: string;
}

// ---- Escalation (Phase 5.9) ----
export const ESCALATION_STATUSES = ['PENDING', 'ACKNOWLEDGED', 'RESOLVED'] as const;
export const ESCALATION_REASONS = [
  'LOW_CONFIDENCE',
  'EXPLICIT_REQUEST',
  'POLICY_RULE',
  'COMPLEX_CASE',
] as const;

export interface EscalationItem {
  id: string;
  ticketId: string;
  reason: string;
  assignedAgentId: string | null;
  slaDeadline: string;
  status: string;
  resolutionNote: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

// ---- Users (Phase 3) ----
export interface UserItem {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// ---- Audit Logs (Phase 5.11) ----
export interface AuditLogItem {
  id: string;
  actorType: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  changesJson: Record<string, unknown> | null;
  createdAt: string;
}

// ---- RAG Query (Phase 5.6) ----
export interface RagCitation {
  index: number;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  section: string | null;
}

export interface RagAnswer {
  answer: string;
  citations: RagCitation[];
  confidence: number;
  confidenceBreakdown: {
    avgTopSimilarity: number;
    retrievalCoverage: number;
    llmSelfScore: number;
  };
  needsEscalation: boolean;
  provider: string;
  model: string;
  latencyMs: number;
}

// ---- Settings (Admin Module) ----
export interface SystemSettingItem {
  id: string;
  key: string;
  value: unknown;
  category: string;
  label: string | null;
  updatedAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface RoutingRuleItem {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  conditions: unknown;
  action: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}