# Technical Design Document
## Track D — AI Customer Support Automation System

**Phiên bản:** 1.1
**Vai trò tác giả:** Principal AI Solution Architect / Tech Lead
**Đối tượng đọc:** Đội kỹ thuật thực hiện Technical Assessment (GFT — Track D: Automation/Agent, Tổng đài Hỗ trợ Tự vận hành)
**Thời hạn bài test:** 07 ngày, từ 24/07/2026 đến 23:59 ngày 31/07/2026 (giờ Việt Nam) — theo đúng Phần 1 của đề bài
**Trạng thái:** DRAFT — chờ xác nhận từng Phase trước khi lập trình

> **Đối chiếu với đề bài gốc (Track D):** Tài liệu này được rà soát lại theo đúng nội dung "BÀI TEST - VỊ TRÍ CHUYÊN VIÊN AI ỨNG DỤNG.md" — đề bài yêu cầu hệ thống tiếp nhận yêu cầu từ **nhiều kênh** (website, email, ứng dụng nhắn tin, hệ thống nội bộ), tự xử lý case đủ thông tin, chuyển người khi cần, trả lời có căn cứ/nguồn, nhận biết giới hạn về dữ liệu/độ tin cậy, và cho phép người vận hành quan sát chất lượng hệ thống để cải thiện quy trình. Các mục liên quan đã được cập nhật để bám sát các điểm này (xem đặc biệt Mục 5.3, Mục 14, Mục 17, Mục 18).

> **Ghi chú quan trọng:** Tài liệu này chỉ tập trung vào **kiến trúc và thiết kế**. Không có dòng code nào được viết ở giai đoạn này. Sau khi bạn xác nhận (approve) từng phần, chúng ta mới chuyển sang Implementation Plan chi tiết theo Phase, và chỉ bắt đầu code khi Phase đó đã được chốt kiến trúc.

---

## MỤC LỤC

1. Tổng quan hệ thống & Mục tiêu kinh doanh
2. Nguyên tắc kiến trúc (Architecture Principles)
3. Technology Stack (100% Free Tier)
4. Kiến trúc tổng thể (High-Level Architecture)
5. Thiết kế Module (Module-by-Module Design)
6. Cấu trúc thư mục dự án (Project Folder Structure)
7. Thiết kế RAG Pipeline (Enterprise-grade)
8. Thiết kế AI Processing Workflow
9. Ticket State Machine
10. Thiết kế Database (ERD)
11. Thiết kế REST API
12. Thiết kế Background Jobs (BullMQ Workers)
13. Observability (Prometheus / Grafana / Logging / Tracing)
14. Kế hoạch triển khai theo Phase (07 ngày theo đúng thời hạn đề bài)
15. Rủi ro, giới hạn & Ghi chú cho Free Tier
16. Định nghĩa "Hoàn thành" (Definition of Done) & Bước tiếp theo

---

# 1. TỔNG QUAN HỆ THỐNG & MỤC TIÊU KINH DOANH

## 1.1. Bài toán

Xây dựng một hệ thống tự động hóa hỗ trợ khách hàng (AI Customer Support Automation) có khả năng:

- Tiếp nhận yêu cầu (ticket/message) từ nhiều kênh (ban đầu: Web/API).
- Tự động phân loại, đánh giá độ ưu tiên, phát hiện spam, phát hiện trùng lặp, phát hiện thiếu thông tin.
- Trả lời tự động bằng RAG dựa trên Knowledge Base nội bộ.
- Tự động chuyển (escalate) cho nhân viên hỗ trợ khi độ tin cậy AI thấp hoặc vượt ngưỡng rủi ro.
- Duy trì ngữ cảnh hội thoại đa lượt (multi-turn).
- Cung cấp Dashboard giám sát vận hành cho Admin/Agent.
- Ghi Audit Log đầy đủ, phục vụ truy vết & compliance.

## 1.2. Ràng buộc dự án

| Ràng buộc | Chi tiết |
|---|---|
| Ngân sách | 0 đồng — chỉ dùng dịch vụ/công cụ Free Tier |
| Thời gian | 07 ngày theo lịch (24/07 – 31/07/2026), 1 kỹ sư, ước tính ~5-6 ngày công hiệu quả sau khi trừ thời gian quay video, viết tài liệu bàn giao |
| Chất lượng | Kiến trúc chuẩn Production, có thể tách Microservices trong tương lai; ưu tiên **giải pháp đơn giản, chạy ổn định** hơn là đầy đủ tính năng nhưng thiếu ổn định (đúng tinh thần chấm điểm của đề: *"Một giải pháp đơn giản, rõ ràng và hoạt động tốt có thể được đánh giá cao hơn một giải pháp phức tạp nhưng thiếu ổn định"*) |
| Phạm vi | Modular Monolith — KHÔNG triển khai Microservices thật ở giai đoạn này |
| Đa kênh | Đề bài yêu cầu tiếp nhận từ nhiều kênh (website, email, app nhắn tin, hệ thống nội bộ) → kiến trúc phải trừu tượng hoá khái niệm "Channel" ngay từ đầu (xem Mục 5.3), dù trong 7 ngày chỉ implement thật 1-2 kênh |
| Tiêu chí chấm điểm | Không chỉ code chạy được, mà còn: hiểu đúng nhiệm vụ, chọn đúng phạm vi, ưu tiên công việc, trình bày trung thực phần đã/chưa làm → xem Mục 17 (Nhật ký quyết định) và Mục 18 (Checklist hồ sơ nộp bài) |

## 1.3. Định hướng thiết kế do ràng buộc thời gian

Vì thời gian chỉ có 7 ngày (thay vì kế hoạch Enterprise chuẩn ~4-6 tuần), tài liệu này áp dụng nguyên tắc **"Architecture-complete, Scope-lean"**:

- Kiến trúc được thiết kế **đầy đủ và đúng chuẩn** như một hệ thống Enterprise thật (để bạn được đánh giá cao ở phần Solution Design).
- Phạm vi triển khai code (Implementation Scope) ở phần Phase sẽ được **ưu tiên hóa (MoSCoW)**: Must-have chạy được end-to-end trong 7 ngày, Should-have/Could-have được thiết kế sẵn nhưng có thể là "stub"/"interface sẵn sàng mở rộng" nếu hết thời gian.
- Điều này đúng với tinh thần Clean Architecture: kiến trúc không phụ thuộc vào việc bao nhiêu use case đã được implement — ta có thể dừng ở bất kỳ đâu mà hệ thống vẫn "chạy được" và mở rộng an toàn.

---

# 2. NGUYÊN TẮC KIẾN TRÚC (ARCHITECTURE PRINCIPLES)

## 2.1. Clean Architecture (4 lớp)

```
┌─────────────────────────────────────────────┐
│  Presentation (Controllers, GraphQL/REST,    │
│  Guards, Interceptors, DTO mapping)          │
├─────────────────────────────────────────────┤
│  Application (Use Cases, CQRS Commands/      │
│  Queries, Application Services, Ports)       │
├─────────────────────────────────────────────┤
│  Domain (Entities, Value Objects, Domain     │
│  Events, Domain Services, Business Rules)    │
├─────────────────────────────────────────────┤
│  Infrastructure (Prisma Repositories, LLM    │
│  Clients, Queue, Cache, Storage, External    │
│  APIs)                                       │
└─────────────────────────────────────────────┘
```

**Luật phụ thuộc (Dependency Rule):** mũi tên phụ thuộc luôn hướng **vào trong** (Presentation → Application → Domain). Domain **không** import bất cứ thứ gì từ Infrastructure hay Presentation. Infrastructure implement các **Port/Interface** được định nghĩa ở Application/Domain (Dependency Inversion).

## 2.2. SOLID trong bối cảnh NestJS

| Nguyên tắc | Áp dụng cụ thể |
|---|---|
| **S**ingle Responsibility | Mỗi Use Case = 1 class = 1 hành động nghiệp vụ (vd `ClassifyTicketUseCase`, không gộp classify + priority trong 1 class) |
| **O**pen/Closed | Chiến lược AI (classification, embedding, LLM provider) được implement qua Strategy Pattern + DI Token, thêm provider mới không sửa code cũ |
| **L**iskov Substitution | Mọi implementation của `ILlmProvider`, `IVectorStore`, `IEmbeddingProvider` phải hoán đổi được cho nhau |
| **I**nterface Segregation | Interface nhỏ, chuyên biệt: `IReadTicketRepository` / `IWriteTicketRepository` thay vì 1 interface khổng lồ |
| **D**ependency Inversion | Application/Domain định nghĩa Port (interface), Infrastructure implement; NestJS DI Container wire bằng token (`@Inject(TICKET_REPOSITORY)`) |

## 2.3. Domain-Driven Design (Lightweight)

Áp dụng **Tactical DDD** ở mức vừa phải (không Event Sourcing, không full Aggregate phức tạp — vì scope 7 ngày):

- **Bounded Context** = Module (Ticket, Conversation, Knowledge Base, AI, Identity...).
- **Aggregate Root**: `Ticket` là aggregate root, chứa `TicketMessage[]` là entity con bên trong, mọi thay đổi trạng thái đi qua Ticket.
- **Value Objects**: `ConfidenceScore`, `PriorityLevel`, `Email`, `TicketStatus` — immutable, tự validate.
- **Domain Events**: `TicketCreatedEvent`, `TicketEscalatedEvent`, `AnswerGeneratedEvent`... phát ra từ Aggregate, xử lý qua Event Emitter nội bộ (lightweight, không cần Event Store).
- **Domain Services**: logic nghiệp vụ không thuộc về 1 entity cụ thể (vd `DuplicateDetectionDomainService`).

## 2.4. Modular Monolith / Feature-first

- Toàn bộ deploy như **1 process Node.js duy nhất**, nhưng code được tổ chức theo **module nghiệp vụ** (feature-first), mỗi module có ranh giới rõ (domain/application/infrastructure/presentation riêng).
- Giao tiếp **giữa module** chỉ qua: (a) Public Application Service/Facade được export tường minh, hoặc (b) Domain Event nội bộ. **Không** cho phép module A import thẳng Repository/Entity nội bộ của module B.
- Đây là điều kiện tiên quyết để "dễ dàng tách thành Microservices trong tương lai": mỗi module = 1 ứng viên service, ranh giới network sẽ thay thế ranh giới in-process mà không phải viết lại business logic.

## 2.5. CQRS (áp dụng có chọn lọc)

Không áp dụng CQRS toàn hệ thống (over-engineering cho scope này). Áp dụng CQRS **lightweight (cùng 1 DB, tách Command/Query ở tầng Application)** cho các module có tải đọc/ghi lệch nhau rõ rệt:

- **Ticket Module**: Command (`CreateTicketCommand`, `EscalateTicketCommand`) tách khỏi Query (`GetTicketListQuery`, `GetTicketDetailQuery`) — vì Dashboard cần query phức tạp (filter, pagination, aggregation) khác hẳn command đơn giản.
- **Dashboard/Analytics Module**: thuần Query, đọc từ read-model được tổng hợp sẵn (materialized qua Analytics Worker) để không tạo áp lực lên OLTP tables.
- Các module đơn giản (Identity, Settings) **không** áp dụng CQRS — dùng Service pattern thông thường để tránh phức tạp không cần thiết.

## 2.6. Event-Driven Communication (Lightweight)

- Dùng **NestJS EventEmitter2** (in-process, async) cho giao tiếp nội bộ giữa module — KHÔNG dùng Kafka/RabbitMQ (không cần thiết cho scope, không free-tier tốt).
- Dùng **BullMQ + Redis** cho tác vụ cần: (a) chạy nền lâu (embedding, parse document), (b) cần retry/backoff, (c) cần decouple khỏi HTTP request lifecycle.
- Quy tắc: Domain Event (nội bộ, đồng bộ trong process, dùng cho phản ứng nghiệp vụ tức thời như "gửi notification khi ticket được tạo") khác với Queue Job (bất đồng bộ, dùng cho tác vụ nặng/chậm).

## 2.7. Configuration-driven Design

- Mọi hành vi có thể thay đổi theo môi trường/khách hàng đều đưa ra config, không hard-code:
  - Ngưỡng confidence để escalate (`AI_CONFIDENCE_ESCALATION_THRESHOLD`)
  - Danh sách category cho classification
  - LLM provider đang active + fallback chain
  - Chunking strategy (size, overlap)
  - Retry policy cho từng queue
- Dùng NestJS `ConfigModule` + Zod/Joi schema validation khi boot, fail-fast nếu thiếu biến môi trường bắt buộc.

## 2.8. Khả năng tách Microservices trong tương lai

Chiến lược "Modular Monolith → Microservices" được đảm bảo bởi:

1. Module = Bounded Context, có DB schema riêng biệt về mặt logic (Prisma schema tổ chức theo namespace/prefix bảng theo module).
2. Giao tiếp liên module qua Interface (Facade) → khi tách service, Facade chuyển thành HTTP/gRPC client mà không đổi business logic.
3. Domain Event nội bộ (EventEmitter2) → khi tách service, chuyển thành message broker (Redis Streams/RabbitMQ) mà không đổi domain logic (chỉ đổi lớp Infrastructure adapter).
4. Background Worker (BullMQ) đã tách theo process riêng (`worker` entrypoint) → sẵn sàng deploy độc lập.

---

# 3. TECHNOLOGY STACK (100% FREE TIER)

| Lớp | Công nghệ | Lý do chọn |
|---|---|---|
| Backend Framework | NestJS + TypeScript | DI container mạnh, module system khớp Clean Architecture, decorator-based, hỗ trợ CQRS/Event tốt |
| Database | PostgreSQL | Free, mạnh, hỗ trợ JSONB + pgvector extension |
| ORM | Prisma | Type-safe, migration tốt, dev velocity cao |
| Queue | BullMQ + Redis | Chuẩn de-facto Node.js, hỗ trợ retry/backoff/DLQ tốt |
| Vector DB | **pgvector** (chọn thay vì ChromaDB) | Dùng chung 1 Postgres instance duy nhất → giảm hạ tầng, giảm chi phí vận hành free-tier (Render/Railway free chỉ cho 1 DB dễ quản lý), transaction nhất quán giữa dữ liệu quan hệ và vector |
| LLM Provider | Groq (Llama 3.1/3.3 free tier, tốc độ cao) là **primary**; Google Gemini Free là **fallback** | Groq có tốc độ suy luận rất nhanh (phù hợp real-time chat), Gemini Free làm dự phòng khi rate-limit |
| Embedding Model | **Google Gemini `text-embedding-004`** (free) hoặc **BAAI/bge-small-en-v1.5 chạy local qua `@xenova/transformers`** (free, không cần API key) | Đề xuất dùng bge-small chạy local để không phụ thuộc rate-limit embedding API và tiết kiệm quota free tier cho phần generation |
| Observability | Prometheus + Grafana | Chuẩn Open Source, self-host free trên Docker |
| Container | Docker + Docker Compose | Chuẩn hoá môi trường dev/prod |
| Auth | JWT (access + refresh token) | Đơn giản, đủ dùng, không cần OAuth phức tạp cho scope này |
| File Storage | Local Filesystem (dev) → MinIO (nếu deploy) | MinIO tương thích S3 API, free self-host |
| Frontend | Next.js 14 (App Router) + TailwindCSS | SSR tốt cho Dashboard, ecosystem free hosting Vercel |
| Deployment | Render (backend + Postgres + Redis free tier) hoặc Railway; Vercel (frontend) | Free tier đủ cho demo/assessment |

### Lý do chọn pgvector thay vì ChromaDB (quyết định kiến trúc quan trọng)

| Tiêu chí | pgvector | ChromaDB |
|---|---|---|
| Hạ tầng bổ sung | Không cần (extension của Postgres đã có) | Cần thêm 1 service riêng |
| Transaction nhất quán (ticket + embedding) | Có (cùng DB, cùng transaction) | Không (2 hệ thống riêng, eventual consistency) |
| Free hosting | Free trên Render/Railway Postgres | Cần tự host thêm container, tốn RAM free tier vốn hạn chế |
| Độ phù hợp quy mô Assessment | Rất phù hợp (dữ liệu vừa/nhỏ) | Overkill cho scope |

→ **Quyết định: pgvector.**

---

# 4. KIẾN TRÚC TỔNG THỂ (HIGH-LEVEL ARCHITECTURE)

```
                         ┌────────────────────────┐
                         │   Next.js Dashboard     │
                         │  (Agent / Admin UI)     │
                         └────────────┬────────────┘
                                      │ REST (JWT)
                                      ▼
┌───────────────────────────────────────────────────────────────┐
│                     NestJS Modular Monolith (API)              │
│                                                                  │
│  Presentation Layer (Controllers / Guards / Interceptors)      │
│  ───────────────────────────────────────────────────────────  │
│  Application Layer (Use Cases / CQRS Handlers / Facades)       │
│  ───────────────────────────────────────────────────────────  │
│  Domain Layer (Entities / VOs / Domain Events / Domain Svc)    │
│  ───────────────────────────────────────────────────────────  │
│  Infrastructure Layer (Prisma Repos / LLM Clients / Storage)   │
│                                                                  │
│  Modules: Identity | Customer | Ticket | Conversation |        │
│  KnowledgeBase | RAG | AI | Routing | Escalation |             │
│  Notification | Audit | Dashboard | Monitoring | Analytics |   │
│  Admin | Settings | Worker | Shared | Infrastructure           │
└───────────┬───────────────────────────────────────┬────────────┘
            │                                        │
            ▼                                        ▼
   ┌─────────────────┐                     ┌──────────────────────┐
   │   PostgreSQL     │                     │   Redis (BullMQ)      │
   │  (+ pgvector)    │                     │  Queues + Cache       │
   └─────────────────┘                     └──────────┬────────────┘
                                                        │
                                                        ▼
                                         ┌────────────────────────────┐
                                         │  Worker Process (separate   │
                                         │  entrypoint, same codebase) │
                                         │  Embedding / Parser / Email │
                                         │  / Analytics / Retry        │
                                         └──────────┬─────────────────┘
                                                     │
                          ┌──────────────────────────┼─────────────────────────┐
                          ▼                          ▼                         ▼
                 ┌─────────────────┐      ┌──────────────────┐      ┌──────────────────┐
                 │ Groq / Gemini    │      │ Local Embedding   │      │ MinIO / Local FS  │
                 │ (LLM Providers)  │      │ (bge-small)       │      │ (File Storage)    │
                 └─────────────────┘      └──────────────────┘      └──────────────────┘

                 ┌──────────────────────────────────────────┐
                 │  Prometheus (scrape /metrics) → Grafana   │
                 └──────────────────────────────────────────┘
```

**Điểm thiết kế quan trọng:**

- API process và Worker process **dùng chung 1 codebase** (chung Domain/Application layer), chỉ khác entrypoint (`main.ts` vs `worker.main.ts`) → tránh trùng lặp logic, đúng nguyên tắc DRY, đồng thời cho phép scale độc lập (API instance riêng, Worker instance riêng) khi cần.
- Toàn bộ lời gọi LLM/Embedding đều đi qua **Port (Interface) ở Domain/Application**, Infrastructure là nơi implement adapter cụ thể (Groq Adapter, Gemini Adapter, Local Embedding Adapter) → đổi provider chỉ cần đổi binding DI, không sửa business logic (Open/Closed Principle).

---

# 5. THIẾT KẾ MODULE (MODULE-BY-MODULE DESIGN)

> Quy ước ký hiệu: 🔑 = Aggregate Root | 📦 = Entity/VO | 🎯 = Use Case | 🔌 = Port/Interface | 📢 = Domain Event

## 5.1. Identity Module

**Purpose:** Quản lý authentication/authorization cho Agent, Admin (không phải end-customer — customer không cần tài khoản để tạo ticket qua kênh public).

**Responsibilities:** Đăng nhập, refresh token, phân quyền theo Role (Admin, Agent, Viewer), quản lý mật khẩu.

**Entities:**
- 🔑 `User` (id, email, passwordHash, role, isActive, createdAt)
- 📦 `RefreshToken` (id, userId, tokenHash, expiresAt, revokedAt)

**Use Cases:** `LoginUseCase`, `RefreshTokenUseCase`, `LogoutUseCase`, `ChangePasswordUseCase`, `CreateAgentUseCase` (Admin only)

**Repository:** `IUserRepository` (findByEmail, findById, save), `IRefreshTokenRepository`

**Service:** `AuthService` (hash/verify password qua bcrypt, sign/verify JWT), `PermissionService` (kiểm tra RBAC)

**Controller:** `AuthController` (`/auth/login`, `/auth/refresh`, `/auth/logout`), `UserController` (`/users` — Admin only)

**DTO:** `LoginDto`, `TokenResponseDto`, `CreateUserDto`, `UserResponseDto`

**Domain Events:** 📢 `UserLoggedInEvent` (phục vụ Audit Module)

**Dependencies:** Shared Module (JWT config), Audit Module (log login events)

**Folder:**
```
modules/identity/
  domain/{entities,value-objects,events}/
  application/{use-cases,ports,dto}/
  infrastructure/{repositories,strategies}/
  presentation/{controllers,guards}/
```

---

## 5.2. Customer Module

**Purpose:** Lưu trữ thông tin khách hàng gửi yêu cầu (không cần đăng nhập — định danh qua email/external ref).

**Responsibilities:** Tạo/tra cứu Customer theo email, lưu lịch sử liên hệ, gắn cờ khách hàng "khó tính"/VIP (mở rộng tương lai).

**Entities:**
- 🔑 `Customer` (id, email, name, phone, metadata JSONB, firstSeenAt)

**Use Cases:** `FindOrCreateCustomerUseCase`, `GetCustomerHistoryUseCase`

**Repository:** `ICustomerRepository`

**Service:** `CustomerService`

**Controller:** `CustomerController` (`/customers`, `/customers/:id/tickets`) — nội bộ, dùng cho Agent tra cứu

**DTO:** `CreateCustomerDto`, `CustomerResponseDto`

**Domain Events:** 📢 `NewCustomerRegisteredEvent`

**Dependencies:** Ticket Module (đọc lịch sử — qua Facade, không đọc thẳng repository)

**Folder:** tương tự cấu trúc Identity.

---

## 5.3. Ticket Module (⭐ Core Module — Aggregate Root chính)

**Purpose:** Quản lý toàn bộ vòng đời của một yêu cầu hỗ trợ (Ticket), là trung tâm điều phối của hệ thống.

**Responsibilities:** Tạo ticket, quản lý State Machine, gắn category/priority, lưu lịch sử thay đổi trạng thái, expose Query cho Dashboard.

**Entities:**
- 🔑 `Ticket` (id, customerId, **channel**[WEB/EMAIL/CHAT_APP/INTERNAL], subject, status, category, priority, confidenceScore, assignedAgentId, isSpam, isDuplicateOf, missingInfoFlags[], createdAt, updatedAt, resolvedAt)
- 📦 `TicketMessage` (id, ticketId, sender[CUSTOMER/AGENT/AI], content, attachments[], **channelMetadata** JSONB, createdAt)
- 📦 `TicketStatusHistory` (id, ticketId, fromStatus, toStatus, changedBy, reason, changedAt)
- 📦 Value Objects: `TicketStatus` (enum có validate transition), `PriorityLevel` (LOW/MEDIUM/HIGH/URGENT), `ConfidenceScore` (0.0–1.0, tự validate range), `Channel` (enum)

**Kênh tiếp nhận (multi-channel — theo đúng yêu cầu đề bài):** Đề bài yêu cầu yêu cầu khách hàng có thể đến từ website, email, ứng dụng nhắn tin, hệ thống nội bộ. Để tránh hard-code luồng xử lý riêng cho từng kênh (vi phạm Open/Closed), thiết kế dùng **Channel Adapter Pattern**:

- 🔌 `IChannelAdapter` (Port, định nghĩa ở Application layer của Ticket Module): `parseIncoming(rawPayload): CreateTicketCommand`, `sendReply(ticketId, content): Promise<void>`.
- Mỗi kênh là 1 Infrastructure Adapter implement port trên: `WebChannelAdapter` (nhận trực tiếp qua REST, không cần parse nhiều), `EmailChannelAdapter` (đọc mailbox qua IMAP hoặc webhook từ dịch vụ email free như Resend/Mailgun sandbox, parse subject/body/from thành `CreateTicketCommand`), `ChatAppChannelAdapter` (webhook từ Telegram Bot API — free, dễ tích hợp nhất trong nhóm "ứng dụng nhắn tin" để demo), `InternalChannelAdapter` (API nội bộ, dùng chính bởi Dashboard/Agent).
- Toàn bộ 4 adapter đều hội tụ về **cùng 1 Use Case** (`CreateTicketUseCase`) — khác nhau chỉ ở bước parse đầu vào và bước gửi phản hồi ra, không có nhánh rẽ business logic theo kênh ở tầng Application/Domain.
- **Phạm vi triển khai thật trong 7 ngày (theo MoSCoW, Mục 14.1):** `WebChannelAdapter` là **Must have** (dễ demo qua Dashboard/Postman); `ChatAppChannelAdapter` (Telegram) là **Should have** vì miễn phí, nhanh, chứng minh được tính đa kênh sống động cho video demo; `EmailChannelAdapter`/`InternalChannelAdapter` là **Could have** — nếu không kịp code thật, vẫn giữ Port + adapter rỗng (throw `NotImplementedException` có ghi chú rõ) để minh chứng kiến trúc đã sẵn sàng mở rộng mà không nói dối là "đã làm xong".

**Use Cases (CQRS):**
- Command: `CreateTicketUseCase`, `UpdateTicketStatusUseCase`, `AssignAgentUseCase`, `MarkAsSpamUseCase`, `MarkAsDuplicateUseCase`, `AddCustomerMessageUseCase`
- Query: `GetTicketByIdQuery`, `ListTicketsQuery` (filter/pagination/sort), `GetTicketTimelineQuery`

**Repository:** `ITicketRepository` (write), `ITicketReadRepository` (query tối ưu, có thể dùng raw SQL/Prisma cho performance)

**Service:** `TicketStateMachineService` (validate & thực thi transition), `TicketDomainService`

**Controller:** `TicketController` (`/tickets` CRUD + `/tickets/:id/messages`, `/tickets/:id/escalate`)

**DTO:** `CreateTicketDto`, `TicketResponseDto`, `TicketListQueryDto`, `TicketTimelineDto`

**Domain Events:** 📢 `TicketCreatedEvent`, `TicketStatusChangedEvent`, `TicketEscalatedEvent`, `TicketResolvedEvent`

**Dependencies:** Customer Module, AI Module (qua Facade để lấy classification/priority — Ticket Module KHÔNG gọi thẳng LLM), Routing Module, Audit Module (qua Event, không gọi trực tiếp)

---

## 5.4. Conversation Module

**Purpose:** Quản lý ngữ cảnh hội thoại đa lượt giữa Customer/AI/Agent gắn với 1 Ticket (tách khỏi Ticket Module để giữ Single Responsibility: Ticket quản lý *trạng thái nghiệp vụ*, Conversation quản lý *ngữ cảnh chat*).

**Responsibilities:** Lưu trữ lịch sử hội thoại có cấu trúc phục vụ prompt construction (context window management), tóm tắt hội thoại dài (summarization) để tránh vượt context limit của LLM free tier.

**Entities:**
- 🔑 `Conversation` (id, ticketId, summary, turnCount, lastActivityAt)
- 📦 `ConversationTurn` (id, conversationId, role[USER/ASSISTANT/SYSTEM], content, tokensEstimate, createdAt)

**Use Cases:** `AppendTurnUseCase`, `GetConversationContextUseCase` (trả về N turn gần nhất + summary, có budget token), `SummarizeConversationUseCase` (chạy khi turnCount vượt ngưỡng, dùng LLM để nén)

**Repository:** `IConversationRepository`

**Service:** `ContextWindowBuilderService` (áp dụng chiến lược: N lượt gần nhất verbatim + summary các lượt cũ hơn, để không vượt token limit của model free)

**Controller:** `ConversationController` (`/conversations/:ticketId`)

**DTO:** `ConversationContextDto`, `TurnDto`

**Domain Events:** 📢 `ConversationSummarizedEvent`

**Dependencies:** AI Module (dùng LLM để summarize), Ticket Module (liên kết 1-1 với Ticket)

---

## 5.5. Knowledge Base Module

**Purpose:** Quản lý vòng đời tài liệu nguồn tri thức (upload, versioning, trạng thái xử lý) — KHÔNG chứa logic vector/embedding (thuộc RAG Module) để tách biệt "quản lý nội dung" khỏi "biểu diễn vector".

**Responsibilities:** Upload/lưu file gốc, quản lý metadata tài liệu (category, tags, ownership), trigger pipeline xử lý (qua Queue), quản lý version, soft-delete.

**Entities:**
- 🔑 `KnowledgeDocument` (id, title, sourceType[FILE/URL/TEXT], filePath, status[PENDING/PROCESSING/READY/FAILED], version, tags[], uploadedBy, createdAt)

**Use Cases:** `UploadDocumentUseCase`, `ListDocumentsUseCase`, `DeleteDocumentUseCase`, `ReprocessDocumentUseCase`

**Repository:** `IKnowledgeDocumentRepository`

**Service:** `DocumentValidationService` (kiểm tra định dạng, kích thước)

**Controller:** `KnowledgeBaseController` (`/kb/documents`)

**DTO:** `UploadDocumentDto`, `DocumentResponseDto`

**Domain Events:** 📢 `DocumentUploadedEvent` (→ trigger Document Parser Worker), `DocumentProcessingFailedEvent`

**Dependencies:** RAG Module (qua Event, để chunk/embed), File Storage (Infrastructure)

---

## 5.6. RAG Module (⭐ Core Module)

**Purpose:** Toàn bộ pipeline biến tài liệu thành tri thức truy vấn được (chunking, embedding, retrieval, re-ranking) và sinh câu trả lời có trích dẫn.

**Responsibilities:** Xem chi tiết ở **Mục 7 — Thiết kế RAG Pipeline**.

**Entities:**
- 🔑 `KnowledgeChunk` (id, documentId, content, chunkIndex, tokenCount, metadata JSONB)
- 📦 `ChunkEmbedding` (chunkId, vector[pgvector], embeddingModel, createdAt)

**Use Cases:** `ChunkDocumentUseCase`, `EmbedChunksUseCase`, `RetrieveRelevantChunksUseCase` (hybrid search), `GenerateAnswerUseCase` (prompt construction + LLM call + citation)

**Repository:** `IKnowledgeChunkRepository`, `IVectorSearchRepository` (raw SQL pgvector `<=>` cosine distance)

**Service:** `ChunkingService`, `HybridSearchService` (kết hợp vector similarity + full-text search Postgres `tsvector`), `ReRankingService`, `PromptBuilderService`, `ConfidenceScoringService`

**Controller:** không expose trực tiếp ra ngoài (được gọi qua AI Module Facade); có thể expose `/rag/query` cho mục đích test nội bộ/Admin.

**DTO:** `RetrievalResultDto`, `AnswerWithCitationDto`

**Domain Events:** 📢 `ChunksEmbeddedEvent`, `AnswerGeneratedEvent`, `LowConfidenceAnswerEvent` (→ Escalation Module)

**Dependencies:** Knowledge Base Module, AI Module (LLM Port dùng chung), Worker Module (embedding job)

**🔌 Ports quan trọng:** `IEmbeddingProvider`, `IVectorStore`, `ILlmProvider` — định nghĩa ở Application layer, implement ở Infrastructure (Groq/Gemini/Local adapters).

---

## 5.7. AI Module (⭐ Core Module — Orchestration)

**Purpose:** Điều phối toàn bộ workflow xử lý AI cho 1 message đến (Classification → Spam → Duplicate → Missing Info → Priority → gọi RAG → Confidence Evaluation). Đây là "nhạc trưởng" gọi các domain service khác, KHÔNG tự chứa business rule chi tiết của từng bước (mỗi bước ủy quyền cho Domain Service/Module chuyên biệt).

**Responsibilities:** Xem chi tiết ở **Mục 8 — Thiết kế AI Workflow**.

**Entities:**
- 📦 `AiProcessingResult` (Value Object tổng hợp: category, priority, isSpam, isDuplicate, missingFields[], confidence, suggestedAnswer)
- 📦 `PromptLog` (id, useCase, provider, model, promptTokens, completionTokens, latencyMs, requestPayloadRedacted, responseRaw, createdAt) — phục vụ audit/cost-tracking

**Use Cases:** `ProcessIncomingMessageUseCase` (orchestrator chính — Saga đơn giản, lightweight), `ClassifyMessageUseCase`, `DetectSpamUseCase`, `DetectDuplicateUseCase`, `DetectMissingInfoUseCase`, `DetectPriorityUseCase`

**Repository:** `IPromptLogRepository`

**Service:** `LlmOrchestratorService` (chọn provider theo config + fallback chain khi rate-limit), `ClassificationService`, `SpamDetectionService`, `DuplicateDetectionService` (dùng vector similarity qua RAG Module port để so khớp ticket cũ), `MissingInfoDetectionService`, `PriorityDetectionService`

**Controller:** `AiController` (`/ai/process` — dùng nội bộ/test), thông thường được gọi từ Ticket Module qua Facade khi có message mới.

**DTO:** `ProcessMessageResultDto`

**Domain Events:** 📢 `MessageClassifiedEvent`, `SpamDetectedEvent`, `DuplicateDetectedEvent`, `MissingInfoDetectedEvent`

**Dependencies:** RAG Module, Routing Module, Escalation Module, Worker Module (Prompt Log ghi async để không chặn response)

**🔌 Ports:** `ILlmProvider` (methods: `classify()`, `generateAnswer()`, `summarize()`, `embed()` — tách theo capability để dễ implement partial cho provider không hỗ trợ hết)

---

## 5.8. Routing Module

**Purpose:** Quyết định ticket nên đi đâu tiếp theo — AI tự trả lời, chờ thêm thông tin, hay chuyển Agent — dựa trên kết quả từ AI Module. Tách khỏi AI Module vì đây là **business policy** (có thể thay đổi theo cấu hình khách hàng) chứ không phải khả năng AI.

**Responsibilities:** Áp dụng rule engine đơn giản (config-driven) để ra quyết định routing; chọn Agent phù hợp khi cần assign (round-robin/least-busy — mức cơ bản).

**Entities:**
- 📦 `RoutingRule` (id, condition JSONB, action, priority) — config-driven, lưu DB để Admin chỉnh không cần deploy lại
- 📦 `RoutingDecision` (Value Object: action[AUTO_ANSWER/ASK_MORE_INFO/ESCALATE], reason)

**Use Cases:** `DetermineRoutingUseCase`, `AssignAgentUseCase` (round-robin theo workload hiện tại)

**Repository:** `IRoutingRuleRepository`, `IAgentWorkloadRepository`

**Service:** `RoutingPolicyService`

**Controller:** `RoutingController` (`/admin/routing-rules` — Admin quản lý rule)

**DTO:** `RoutingRuleDto`, `RoutingDecisionDto`

**Domain Events:** 📢 `RoutingDecidedEvent`

**Dependencies:** AI Module (input), Escalation Module (output khi quyết định là ESCALATE)

---

## 5.9. Escalation Module

**Purpose:** Xử lý riêng biệt luồng "chuyển cho người" — vì đây là điểm giao thoa quan trọng giữa Automation và Human-in-the-loop, cần audit chặt và SLA riêng.

**Responsibilities:** Tạo Escalation record, chọn/assign Agent, theo dõi SLA phản hồi, thông báo Agent.

**Entities:**
- 🔑 `Escalation` (id, ticketId, reason[LOW_CONFIDENCE/EXPLICIT_REQUEST/POLICY_RULE/COMPLEX_CASE], assignedAgentId, slaDeadline, status[PENDING/ACKNOWLEDGED/RESOLVED], createdAt)

**Use Cases:** `CreateEscalationUseCase`, `AcknowledgeEscalationUseCase`, `ResolveEscalationUseCase`

**Repository:** `IEscalationRepository`

**Service:** `SlaTrackingService`

**Controller:** `EscalationController` (`/escalations`, `/escalations/:id/acknowledge`)

**DTO:** `EscalationResponseDto`

**Domain Events:** 📢 `EscalationCreatedEvent` (→ Notification Module), `SlaBreachedEvent`

**Dependencies:** Ticket Module, Notification Module, Routing Module

---

## 5.10. Notification Module

**Purpose:** Gửi thông báo (email trước mắt; mở rộng Slack/Webhook sau) cho Agent/Admin khi có sự kiện cần chú ý.

**Entities:** 📦 `NotificationLog` (id, type, recipient, channel, status[QUEUED/SENT/FAILED], payload, createdAt)

**Use Cases:** `SendNotificationUseCase`

**Repository:** `INotificationLogRepository`

**Service:** `NotificationDispatcherService` (Strategy Pattern theo channel: Email/Webhook)

**Controller:** không public — chỉ lắng nghe Domain Event nội bộ.

**Domain Events lắng nghe:** `TicketEscalatedEvent`, `SlaBreachedEvent`, `DocumentProcessingFailedEvent`

**Dependencies:** Worker Module (Email Worker thực thi gửi thực tế qua Queue, không gửi đồng bộ trong request)

---

## 5.11. Audit Module

**Purpose:** Ghi log bất biến (append-only) cho mọi hành động quan trọng — phục vụ compliance, truy vết, và giải trình quyết định của AI.

**Entities:**
- 🔑 `AuditLog` (id, actorType[USER/AI/SYSTEM], actorId, action, resourceType, resourceId, changesJson, ipAddress, createdAt) — append-only, không có Update/Delete use case.

**Use Cases:** `RecordAuditLogUseCase` (chỉ lắng nghe Event, không expose write API công khai), `QueryAuditLogsUseCase` (Admin only)

**Repository:** `IAuditLogRepository`

**Service:** `AuditListenerService` (subscribe hầu hết Domain Event toàn hệ thống qua EventEmitter2 wildcard listener)

**Controller:** `AuditController` (`/admin/audit-logs` — read only)

**DTO:** `AuditLogResponseDto`

**Dependencies:** Lắng nghe Event từ TẤT CẢ module khác (thiết kế theo Observer Pattern — Audit Module không được các module khác phụ thuộc ngược lại, chỉ nó tự subscribe).

---

## 5.12. Dashboard Module

**Purpose:** Cung cấp API tổng hợp (aggregated read models) cho Frontend Dashboard — tách khỏi Ticket Module để không làm "phình" Ticket Module với các query tổng hợp phức tạp không thuộc nghiệp vụ ticket thuần túy.

**Responsibilities:** Trả về số liệu tổng quan (ticket theo status/priority/category, thời gian phản hồi trung bình, tỷ lệ AI tự giải quyết vs escalate, top câu hỏi thường gặp).

**Use Cases:** `GetOverviewStatsQuery`, `GetTicketTrendQuery`, `GetAgentPerformanceQuery`, `GetAiPerformanceQuery` (accuracy/confidence trung bình, tỷ lệ escalate)

**Repository:** `IDashboardReadRepository` (raw SQL tối ưu cho aggregation, đọc từ bảng do Analytics Worker materialize sẵn để tránh tính toán nặng theo request)

**Controller:** `DashboardController` (`/dashboard/overview`, `/dashboard/trends`, `/dashboard/ai-performance`)

**DTO:** `OverviewStatsDto`, `TrendDto`

**Dependencies:** Analytics Module (đọc dữ liệu đã tổng hợp), pure Query side của CQRS.

---

## 5.13. Monitoring Module

**Purpose:** Expose health-check & metrics kỹ thuật hệ thống (khác Dashboard Module — Dashboard là nghiệp vụ, Monitoring là kỹ thuật/hạ tầng).

**Responsibilities:** `/health`, `/health/ready`, `/health/live`, `/metrics` (Prometheus format).

**Service:** `HealthCheckService` (kiểm tra DB, Redis, LLM provider reachability), `MetricsService` (đăng ký custom metrics: queue length, LLM latency, confidence distribution)

**Controller:** `MonitoringController`

**Dependencies:** Infrastructure Module (đọc trạng thái kết nối DB/Redis/Queue)

---

## 5.14. Analytics Module

**Purpose:** Tính toán & lưu trữ các chỉ số tổng hợp theo lịch (không tính real-time trong request để tránh tải OLTP).

**Entities:** 📦 `DailyMetricSnapshot` (date, totalTickets, autoResolvedCount, escalatedCount, avgConfidence, avgResponseTimeMs, byCategory JSONB)

**Use Cases:** `ComputeDailySnapshotUseCase` (chạy bởi Analytics Worker theo cron)

**Repository:** `IMetricSnapshotRepository`

**Dependencies:** Ticket Module, AI Module (đọc PromptLog để tính chi phí/latency), Worker Module.

---

## 5.15. Admin Module

**Purpose:** Nhóm các API quản trị hệ thống không thuộc nghiệp vụ riêng của module nào (quản lý Category, quản lý Agent, cấu hình ngưỡng).

**Use Cases:** `ManageCategoriesUseCase`, `ManageAgentsUseCase`, `ViewSystemConfigUseCase`

**Controller:** `AdminController` (`/admin/categories`, `/admin/agents`)

**Dependencies:** Identity Module (RBAC), Settings Module.

---

## 5.16. Settings Module

**Purpose:** Trung tâm hoá toàn bộ config động (thay đổi được lúc runtime qua Admin UI, không cần redeploy) — hiện thực hoá nguyên tắc Configuration-driven Design ở mức data thay vì chỉ env var.

**Entities:** 📦 `SystemSetting` (key, value JSONB, updatedBy, updatedAt) — vd: `AI_CONFIDENCE_ESCALATION_THRESHOLD`, `SPAM_SCORE_THRESHOLD`, `CHUNKING_STRATEGY`.

**Use Cases:** `GetSettingUseCase`, `UpdateSettingUseCase`

**Repository:** `ISettingRepository` (có cache in-memory + TTL để tránh query DB mỗi lần đọc config)

**Controller:** `SettingsController` (`/admin/settings`)

**Dependencies:** được TẤT CẢ module khác đọc qua `ISettingRepository`/`ConfigFacade`, nhưng bản thân Settings Module không phụ thuộc ngược lại module nào.

---

## 5.17. Worker Module

**Purpose:** Entry point riêng cho tiến trình Worker (không phải "module nghiệp vụ" mà là **module hạ tầng thực thi**), đăng ký toàn bộ BullMQ Processor. Chi tiết ở **Mục 12**.

**Dependencies:** Toàn bộ Application layer của các module khác (Worker gọi lại Use Case đã định nghĩa, không viết business logic riêng trong Worker).

---

## 5.18. Shared Module

**Purpose:** Chứa các thành phần dùng chung, KHÔNG chứa business logic đặc thù của module nào.

**Nội dung:** Base Entity/Value Object class, base Repository interface, common Decorators (`@CurrentUser`, `@Roles`), Exception Filter chuẩn hoá lỗi, Pipe validate chung, Pagination DTO chung, Result/Either type cho xử lý lỗi không dùng exception cho luồng nghiệp vụ dự đoán được.

---

## 5.19. Infrastructure Module

**Purpose:** Cấu hình kết nối hạ tầng dùng chung: Prisma Client Provider, Redis Connection Provider, BullMQ Queue Registration, LLM Provider Adapters (Groq/Gemini), Embedding Provider Adapter, Storage Adapter (Local/MinIO), Logger Provider (Pino, structured JSON logging).

**Nguyên tắc:** Đây là nơi DUY NHẤT chứa code phụ thuộc thư viện bên thứ 3 cụ thể (Prisma Client, ioredis, SDK Groq/Gemini) — các layer khác chỉ biết đến Interface.

---

# 6. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT FOLDER STRUCTURE)

```
ai-customer-support/
├── apps/
│   ├── api/                          # Entry point HTTP API (NestJS)
│   │   ├── src/
│   │   │   └── main.ts
│   │   └── Dockerfile
│   └── worker/                       # Entry point Worker process (BullMQ)
│       ├── src/
│       │   └── worker.main.ts
│       └── Dockerfile
│
├── libs/                             # Business code dùng chung giữa api & worker
│   ├── modules/
│   │   ├── identity/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── value-objects/
│   │   │   │   └── events/
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   ├── ports/
│   │   │   │   └── dto/
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   └── strategies/
│   │   │   ├── presentation/
│   │   │   │   ├── controllers/
│   │   │   │   └── guards/
│   │   │   └── identity.module.ts
│   │   ├── customer/          (cấu trúc tương tự)
│   │   ├── ticket/             (cấu trúc tương tự — module lớn nhất)
│   │   ├── conversation/
│   │   ├── knowledge-base/
│   │   ├── rag/
│   │   ├── ai/
│   │   ├── routing/
│   │   ├── escalation/
│   │   ├── notification/
│   │   ├── audit/
│   │   ├── dashboard/
│   │   ├── monitoring/
│   │   ├── analytics/
│   │   ├── admin/
│   │   └── settings/
│   │
│   ├── shared/
│   │   ├── base/                     # Base Entity, Base VO, Base Repository
│   │   ├── decorators/
│   │   ├── filters/                  # Global Exception Filter
│   │   ├── pipes/
│   │   ├── dto/                      # PaginationDto, ApiResponseDto
│   │   └── types/                    # Result<T, E>, Either
│   │
│   ├── infrastructure/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── prisma.service.ts
│   │   ├── redis/
│   │   ├── queue/                    # BullMQ Queue registration + tokens
│   │   ├── llm/
│   │   │   ├── ports/                # ILlmProvider, IEmbeddingProvider
│   │   │   ├── groq/
│   │   │   ├── gemini/
│   │   │   └── local-embedding/
│   │   ├── vector-store/             # pgvector raw query repository
│   │   ├── storage/                  # Local FS / MinIO adapter
│   │   └── logger/                   # Pino structured logger
│   │
│   └── config/
│       ├── env.validation.ts         # Zod schema, fail-fast on boot
│       └── configuration.ts
│
├── workers/                          # BullMQ Processors (gọi Use Case của libs/modules)
│   ├── embedding.processor.ts
│   ├── document-parser.processor.ts
│   ├── email.processor.ts
│   ├── notification.processor.ts
│   ├── analytics.processor.ts
│   └── retry.processor.ts
│
├── prisma/
│   ├── migrations/
│   └── seed.ts
│
├── test/
│   ├── unit/                         # theo module, test Domain + Use Case (mock port)
│   ├── integration/                  # test Repository thật với Postgres test container
│   └── e2e/                          # test API end-to-end
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── prometheus/prometheus.yml
│   └── grafana/dashboards/
│
├── frontend/                         # Next.js Dashboard (repo riêng hoặc monorepo con)
│   ├── app/
│   ├── components/
│   └── lib/api-client.ts
│
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── package.json
└── README.md
```

**Giải thích lý do tổ chức:**

- **`apps/` tách khỏi `libs/modules/`**: đúng chuẩn Nx/NestJS monorepo — business logic (Domain/Application) không phụ thuộc entrypoint. `apps/api` và `apps/worker` chỉ là "composition root" (bootstrap DI container, import module cần dùng).
- **Mỗi module trong `libs/modules/` tự chứa đủ 4 lớp Clean Architecture** → khi cần tách module thành service riêng, chỉ cần "cắt" nguyên thư mục module đó sang repo mới, viết lại `main.ts` riêng, giữ nguyên toàn bộ domain/application logic.
- **`infrastructure/llm/ports/`** đặt cạnh các adapter cụ thể nhưng interface được import ngược lại từ `application` của từng module (Dependency Inversion — interface do "phía trong" định nghĩa, "phía ngoài" implement).
- **`workers/` tách khỏi `libs/modules/*/infrastructure`**: Processor chỉ là "adapter kích hoạt Use Case", đặt tập trung để dễ thấy toàn bộ background job của hệ thống trong 1 chỗ, nhưng logic thật nằm trong Use Case của module tương ứng (Worker không chứa business logic).

---

# 7. THIẾT KẾ RAG PIPELINE (ENTERPRISE-GRADE)

## 7.1. Luồng dữ liệu tổng thể

```
[1] Upload Document
        │
        ▼
[2] Document Parser Worker (extract text: PDF/DOCX/TXT/MD)
        │
        ▼
[3] Chunking Strategy
        │
        ▼
[4] Metadata Enrichment (attach documentId, category, chunkIndex, tokenCount)
        │
        ▼
[5] Embedding Worker (batch embed)
        │
        ▼
[6] Vector Storage (pgvector)
        │
        ▼
   ── (khi có câu hỏi) ──
        │
[7] Query Embedding
        │
        ▼
[8] Hybrid Retrieval (Vector Similarity + Full-text Search)
        │
        ▼
[9] Re-ranking
        │
        ▼
[10] Prompt Construction (context + citation markers)
        │
        ▼
[11] LLM Answer Generation
        │
        ▼
[12] Citation Attachment + Confidence Scoring
        │
        ▼
[13] Fallback Strategy nếu Confidence thấp → Human Escalation
```

## 7.2. Chi tiết từng bước

**[1] Upload tài liệu:** Qua `KnowledgeBaseController`, file lưu tạm Local FS/MinIO, tạo record `KnowledgeDocument (status=PENDING)`, phát `DocumentUploadedEvent`.

**[2] Document Parser Worker:** Lắng nghe event, extract plain text (dùng `pdf-parse` cho PDF, `mammoth` cho DOCX). Cập nhật `status=PROCESSING`. Lỗi → `status=FAILED` + `DocumentProcessingFailedEvent` (Notification Module báo Admin).

**[3] Chiến lược Chunking:** Dùng **Recursive Character/Token Splitting** với:
- `chunkSize`: ~500 tokens (cấu hình qua Settings Module, không hard-code)
- `chunkOverlap`: ~50-80 tokens (giữ ngữ cảnh liên câu, tránh cắt đứt ý ở ranh giới chunk)
- Ưu tiên cắt theo ranh giới đoạn văn (`\n\n`) → câu (`.`) → từ, tránh cắt giữa câu khi có thể.
- Với tài liệu có cấu trúc (heading Markdown/DOCX), giữ heading làm metadata `section` để tăng chất lượng retrieval.

**[4] Metadata Enrichment:** Mỗi `KnowledgeChunk` lưu kèm: `documentId`, `chunkIndex`, `section`, `tags` kế thừa từ Document, `tokenCount` — dùng để filter trước khi vector search (giảm search space) và để hiển thị citation.

**[5] Embedding Worker:** Batch nhiều chunk trong 1 lần gọi (giảm số request tới API free-tier có rate-limit), lưu `embeddingModel` + `vector` vào bảng `chunk_embeddings` (pgvector `VECTOR(384)` nếu dùng bge-small, hoặc `VECTOR(768)` nếu dùng Gemini embedding — kích thước cấu hình theo model đang active).

**[6] Vector Storage:** pgvector với index `HNSW` (hoặc `IVFFlat` nếu dữ liệu nhỏ) trên cột vector, cosine distance (`vector_cosine_ops`).

**[7] Query Embedding:** Câu hỏi của customer được embed bằng CÙNG model đã dùng để index (bắt buộc nhất quán, guard bằng `embeddingModel` field để tránh so sánh vector khác chiều/khác model).

**[8] Hybrid Search:** Kết hợp 2 nguồn tín hiệu:
- **Vector similarity** (semantic, top-K theo cosine distance qua pgvector).
- **Full-text search** (Postgres `tsvector`/`ts_rank`, bắt các từ khóa chính xác — mã sản phẩm, mã lỗi — mà semantic search có thể bỏ sót).
- Kết hợp điểm bằng **Reciprocal Rank Fusion (RRF)** — đơn giản, không cần train, hiệu quả tốt cho hybrid search.

**[9] Re-ranking:** Với top-N kết quả hybrid (vd N=15), áp dụng re-rank nhẹ:
- Giải pháp free: dùng chính LLM (Groq, rẻ/nhanh) để chấm điểm relevance 0-10 cho từng chunk qua 1 prompt batch, hoặc dùng cross-encoder nhỏ chạy local (`@xenova/transformers`, model `ms-marco-MiniLM`) nếu muốn tránh tốn quota LLM.
- Lấy top-K sau re-rank (vd K=4-5) đưa vào prompt.

**[10] Prompt Construction:** Template chuẩn gồm: System instruction (vai trò, phạm vi trả lời, yêu cầu trích dẫn `[1]`, `[2]`...) + Context (từng chunk kèm số thứ tự nguồn) + Lịch sử hội thoại rút gọn (từ Conversation Module) + Câu hỏi hiện tại. Quản lý token budget rõ ràng (system + context + history + question ≤ giới hạn model, có ưu tiên cắt bớt history trước context nếu vượt).

**[11] LLM Answer Generation:** Gọi qua `ILlmProvider.generateAnswer()`, có timeout + retry + fallback provider (Groq → Gemini) khi lỗi/rate-limit.

**[12] Citation & Confidence Score:**
- Yêu cầu LLM trả lời kèm chỉ số nguồn `[n]` tương ứng chunk đã đưa; map ngược `[n]` → `chunkId` → `documentId` để trả về danh sách nguồn kèm response.
- **Confidence Score** tổng hợp từ nhiều tín hiệu (không chỉ tin vào 1 con số LLM tự chấm — LLM tự đánh giá độ tin cậy của chính nó thường không đáng tin):
  - Điểm similarity trung bình của top chunk được dùng (tín hiệu retrieval có đủ tốt không)
  - Số lượng chunk liên quan tìm được (retrieval coverage)
  - LLM tự đánh giá (self-assessment, dùng như 1 tín hiệu phụ, trọng số thấp)
  - Có phát hiện mâu thuẫn giữa các nguồn không (nếu có → giảm confidence)
- Công thức ví dụ: `confidence = 0.5 * avgTopSimilarity + 0.3 * retrievalCoverage + 0.2 * llmSelfScore`, ngưỡng cấu hình qua Settings Module.

**[13] Fallback Strategy & Human Escalation:**
- Nếu `confidence < threshold` (config, mặc định vd 0.6) → không trả lời tự động, tạo `Escalation` với `reason=LOW_CONFIDENCE`, trả cho customer message chờ Agent (giữ nguyên context đã build để Agent không phải hỏi lại).
- Nếu retrieval không tìm được chunk nào liên quan (similarity quá thấp toàn bộ) → trả lời "không tìm thấy thông tin" thay vì để LLM tự bịa (giảm hallucination), đồng thời escalate.

---

# 8. THIẾT KẾ AI PROCESSING WORKFLOW

```
Incoming Message
      │
      ▼
[1] Classification ──────────► xác định category (Billing/Technical/General/...)
      │
      ▼
[2] Spam Detection ───────────► heuristic + LLM; nếu spam → dừng pipeline, đóng ticket
      │
      ▼
[3] Duplicate Detection ──────► vector similarity so với ticket cũ của cùng customer/toàn hệ thống
      │
      ▼
[4] Missing Information Detection ► kiểm tra field bắt buộc theo category (vd Billing cần mã đơn hàng)
      │
      ▼
[5] Priority Detection ───────► LOW/MEDIUM/HIGH/URGENT dựa trên category + từ khóa khẩn cấp + SLA khách hàng
      │
      ▼
[6] Knowledge Retrieval (RAG) ► chỉ chạy nếu không spam, không duplicate, đủ thông tin
      │
      ▼
[7] Answer Generation ────────► sinh câu trả lời có citation
      │
      ▼
[8] Confidence Evaluation ────► tính điểm tổng hợp (mục 7.2 bước 12)
      │
      ▼
[9] Escalation Decision ──────► Routing Module áp policy: confidence thấp / khách yêu cầu người thật / rule đặc biệt
      │                                        │
      │ (đủ tin cậy)                            │ (không đủ tin cậy)
      ▼                                        ▼
[10] Auto Response to Customer          [10'] Human Agent (Escalation Module assign)
      │                                        │
      └──────────────► [11] Response (qua Conversation Module, lưu turn) ◄────────┘
```

## Trách nhiệm từng bước

| Bước | Module chịu trách nhiệm | Input | Output | Ghi chú |
|---|---|---|---|---|
| Classification | AI Module (`ClassificationService`) | nội dung message | category + độ tin cậy | Danh sách category lấy từ Settings/Admin (config-driven), không hard-code |
| Spam Detection | AI Module (`SpamDetectionService`) | nội dung, tần suất gửi từ customer (rate) | isSpam (bool) + score | Kết hợp heuristic (rate limit, blacklist pattern) + LLM classification nhẹ, tránh gọi LLM cho mọi case rõ ràng (tiết kiệm quota free) |
| Duplicate Detection | AI Module gọi RAG Module Port (`IVectorStore`) so sánh với embedding của ticket gần đây | nội dung + embedding | isDuplicate + ticket gốc | So sánh trong cửa sổ thời gian (vd 30 ngày) & cùng customer trước, mở rộng toàn hệ thống nếu cần |
| Missing Info Detection | AI Module (`MissingInfoDetectionService`) | nội dung + category (đã biết từ bước 1) | danh sách field thiếu | Rule theo category, config trong `RoutingRule`/Settings; nếu thiếu → Routing quyết định `ASK_MORE_INFO`, dừng pipeline tại đây, không sang bước 6 |
| Priority Detection | AI Module (`PriorityDetectionService`) | category, từ khóa, (tương lai: SLA khách hàng) | priority level | Kết hợp rule tường minh (từ khóa "khẩn cấp", "down", "mất tiền") + LLM cho case mơ hồ |
| Knowledge Retrieval | RAG Module | câu hỏi + context hội thoại | top-K chunk | Xem Mục 7 |
| Answer Generation | RAG Module | chunk + prompt template | câu trả lời + citation | Xem Mục 7 |
| Confidence Evaluation | RAG Module + AI Module tổng hợp | tín hiệu retrieval + LLM self-score | confidence score | Xem công thức Mục 7.2 |
| Escalation Decision | Routing Module | toàn bộ `AiProcessingResult` | routing action | Rule engine config-driven, KHÔNG hard-code threshold trong code |
| Human Agent | Escalation Module | routing action = ESCALATE | Escalation record + assign | Notification Module thông báo Agent qua Email Worker |
| Response | Conversation Module | câu trả lời cuối cùng (AI hoặc chờ Agent) | lưu turn, trả về customer | Ghi `ConversationTurn`, cập nhật `TicketStatus` tương ứng |

**Thiết kế orchestration:** `ProcessIncomingMessageUseCase` (AI Module) đóng vai trò **Saga đơn giản, đồng bộ trong 1 request** (không cần Saga pattern phức tạp với compensation vì đây là luồng đọc-tính toán, không có side-effect cần rollback phức tạp — ngoại trừ ghi PromptLog/Audit được thực hiện **bất đồng bộ qua Domain Event** để không làm chậm response time tới customer).

---

# 9. TICKET STATE MACHINE

```
        ┌─────┐
        │ NEW │
        └──┬──┘
           │ AI hoàn tất Classification
           ▼
     ┌───────────┐
     │ CLASSIFIED│
     └─────┬─────┘
           │
     ┌─────┴──────────────────────────┐
     │ đủ thông tin, confidence đủ    │ thiếu thông tin
     ▼                                 ▼
 ┌────────┐                    ┌──────────────────┐
 │ANSWERED│                    │WAITING_CUSTOMER   │
 └───┬────┘                    └─────────┬─────────┘
     │                                    │ customer bổ sung
     │ customer hài lòng (không phản hồi thêm trong X│ thông tin
     │ giờ, hoặc customer xác nhận)        ▼
     │                              (quay lại CLASSIFIED)
     │
     │ confidence thấp / customer yêu cầu người thật
     ▼
 ┌───────────┐
 │ ESCALATED │
 └─────┬─────┘
       │ Agent acknowledge
       ▼
 ┌─────────────┐
 │ IN_PROGRESS │
 └──────┬──────┘
        │ Agent xử lý xong
        ▼
   ┌──────────┐
   │ RESOLVED │
   └────┬─────┘
        │ hết thời gian chờ xác nhận (auto) hoặc Agent đóng thủ công
        ▼
    ┌────────┐
    │ CLOSED │
    └────────┘
```

## Điều kiện chuyển trạng thái

| Từ | Đến | Điều kiện | Ai/Cái gì kích hoạt |
|---|---|---|---|
| NEW | CLASSIFIED | AI hoàn tất bước Classification (Mục 8, bước 1) | `ProcessIncomingMessageUseCase` |
| CLASSIFIED | WAITING_CUSTOMER | `MissingInfoDetection` phát hiện thiếu field bắt buộc | AI Module |
| WAITING_CUSTOMER | CLASSIFIED | Customer gửi message bổ sung, đủ field yêu cầu | `AddCustomerMessageUseCase` re-trigger pipeline |
| CLASSIFIED | ANSWERED | RAG trả lời với confidence ≥ ngưỡng, Routing quyết định AUTO_ANSWER | Routing Module |
| CLASSIFIED / ANSWERED | ESCALATED | confidence < ngưỡng, hoặc spam=false nhưng rule đặc biệt khớp, hoặc customer chủ động yêu cầu Agent, hoặc Agent tự pull | Routing/Escalation Module, hoặc Agent action |
| ESCALATED | IN_PROGRESS | Agent bấm "Acknowledge" | `AcknowledgeEscalationUseCase` |
| IN_PROGRESS | RESOLVED | Agent đánh dấu resolved | `ResolveEscalationUseCase` / `UpdateTicketStatusUseCase` |
| ANSWERED | RESOLVED | Customer không phản hồi thêm trong khoảng thời gian cấu hình (vd 24h) → auto-resolve | Retry/Analytics Worker (cron job) |
| RESOLVED | CLOSED | Auto sau X ngày không có phản hồi thêm (config), hoặc đóng thủ công | Worker cron / Agent |
| bất kỳ (trừ CLOSED) | ESCALATED | Ticket đánh dấu `isSpam=false` nhưng phát sinh khiếu nại/complex case | Agent thủ công (override) |
| bất kỳ | (Ticket bị đánh dấu spam) | `isSpam=true` từ bước Spam Detection — không đi qua state machine chính, đóng thẳng với trạng thái riêng `status=CLOSED, closeReason=SPAM` | AI Module |

**Ràng buộc kỹ thuật:** Mọi transition đi qua `TicketStateMachineService.transition(ticket, targetStatus, actor, reason)` — validate transition hợp lệ theo bảng trên (dùng bảng ma trận transition hợp lệ trong code, không rải `if/else` khắp nơi), ghi `TicketStatusHistory`, phát `TicketStatusChangedEvent`. Transition không hợp lệ ném `InvalidTicketTransitionException` (domain exception, không phải HTTP exception — được map ở Presentation layer).

---

# 10. THIẾT KẾ DATABASE (ERD)

## 10.1. Sơ đồ quan hệ (rút gọn, dạng text ERD)

```
users ──< refresh_tokens
users ──< tickets (assigned_agent_id, nullable)
users ──< audit_logs (actor_id, nullable nếu actor=AI/SYSTEM)

customers ──< tickets

tickets ──< ticket_messages
tickets ──< ticket_status_history
tickets ──1:1── conversations
tickets ──< escalations
tickets >──< tickets (self-ref: is_duplicate_of)

conversations ──< conversation_turns

knowledge_documents ──< knowledge_chunks
knowledge_chunks ──1:1── chunk_embeddings   (pgvector)

escalations }──1 users (assigned_agent_id)

routing_rules (độc lập, đọc bởi Routing Module)
system_settings (độc lập, đọc bởi mọi module)

prompt_logs }──0..1 tickets (ticket_id nullable — có thể log cho conversation-level summarize)
notification_logs }──0..1 escalations

daily_metric_snapshots (độc lập, ghi bởi Analytics Worker)
```

## 10.2. Danh sách bảng chính & mục đích

| Bảng | Mục đích | Index quan trọng |
|---|---|---|
| `users` | Tài khoản Agent/Admin | unique(email) |
| `refresh_tokens` | Quản lý phiên đăng nhập, cho phép revoke | index(userId), index(tokenHash) |
| `customers` | Định danh khách hàng theo email, không cần password | unique(email) |
| `tickets` | Aggregate root — trạng thái, phân loại, độ ưu tiên | index(status), index(customerId), index(assignedAgentId), index(createdAt), composite index(status, priority) cho Dashboard filter |
| `ticket_messages` | Nội dung trao đổi thô gắn với ticket | index(ticketId, createdAt) |
| `ticket_status_history` | Lịch sử chuyển trạng thái — phục vụ audit/timeline UI | index(ticketId, changedAt) |
| `conversations` | Ngữ cảnh hội thoại, gắn 1-1 với ticket | unique(ticketId) |
| `conversation_turns` | Từng lượt hội thoại, dùng build prompt | index(conversationId, createdAt) |
| `knowledge_documents` | Tài liệu nguồn tri thức | index(status), index(uploadedBy) |
| `knowledge_chunks` | Đoạn văn bản đã chunk, có metadata | index(documentId), full-text index `tsvector` trên `content` cho hybrid search |
| `chunk_embeddings` | Vector biểu diễn của chunk (pgvector) | HNSW index trên cột `vector` (cosine ops), unique(chunkId) |
| `escalations` | Ticket đang/đã được chuyển cho người | index(status), index(assignedAgentId), index(slaDeadline) cho job quét SLA breach |
| `routing_rules` | Rule config-driven cho quyết định routing | index(priority) — thứ tự áp rule |
| `notification_logs` | Log gửi thông báo, phục vụ retry/audit | index(status), index(createdAt) |
| `audit_logs` | Log bất biến mọi hành động quan trọng | index(resourceType, resourceId), index(actorId), index(createdAt) — append-only, cân nhắc partition theo tháng nếu dữ liệu lớn (tương lai) |
| `prompt_logs` | Log từng lần gọi LLM — phục vụ cost tracking & debug | index(ticketId), index(useCase), index(createdAt) |
| `system_settings` | Config động runtime | unique(key) |
| `daily_metric_snapshot` | Số liệu tổng hợp theo ngày cho Dashboard | unique(date) |

## 10.3. Ghi chú thiết kế quan trọng

- **`chunk_embeddings` tách bảng riêng khỏi `knowledge_chunks`** (thay vì thêm cột vector thẳng vào chunks): cho phép 1 chunk có thể có **nhiều embedding từ nhiều model khác nhau** trong tương lai (vd khi đổi embedding model, giữ cả cũ và mới trong giai đoạn migration) mà không phá vỡ dữ liệu chunk gốc.
- **`prompt_logs.requestPayloadRedacted`**: PII (email, số điện thoại khách hàng) được redact trước khi lưu log, chỉ audit_logs mới lưu đủ ngữ cảnh có kiểm soát quyền truy cập chặt (Admin only).
- **Soft delete** áp dụng cho `knowledge_documents` (cột `deletedAt` nullable) — không hard-delete để không phá vỡ tham chiếu từ `knowledge_chunks`/lịch sử trả lời cũ đã cite tài liệu đó.
- **pgvector**: cần enable extension `CREATE EXTENSION IF NOT EXISTS vector;` trong migration đầu tiên; kiểu cột `vector(384)` (bge-small) hoặc `vector(768)` (Gemini embedding) tùy quyết định cuối cùng ở Phase 4.

---

# 11. THIẾT KẾ REST API

> Chuẩn chung: mọi response bọc trong envelope `{ success, data, error, meta }`; auth qua header `Authorization: Bearer <JWT>`; lỗi trả `{ success: false, error: { code, message, details } }` với HTTP status chuẩn (400/401/403/404/409/422/500).

## 11.1. Authentication

| Endpoint | Method | Request DTO | Response DTO | Auth | Ghi chú |
|---|---|---|---|---|---|
| `/auth/login` | POST | `LoginDto{email,password}` | `TokenResponseDto{accessToken,refreshToken,user}` | Public | Rate-limit theo IP chống brute-force |
| `/auth/refresh` | POST | `RefreshTokenDto{refreshToken}` | `TokenResponseDto` | Public (token trong body) | Revoke token cũ sau khi refresh (rotation) |
| `/auth/logout` | POST | `RefreshTokenDto` | `{success:true}` | Bearer | Revoke refresh token |
| `/users` | POST | `CreateUserDto{email,password,role}` | `UserResponseDto` | Bearer + Role(ADMIN) | Validate email unique, password policy |
| `/users` | GET | Query: page,limit,role | `PaginatedDto<UserResponseDto>` | Bearer + Role(ADMIN) | |

## 11.2. Knowledge Base

| Endpoint | Method | Request | Response | Auth | Validation |
|---|---|---|---|---|---|
| `/kb/documents` | POST | multipart file + `UploadDocumentDto{title,tags}` | `DocumentResponseDto{id,status}` | Bearer + Role(ADMIN/AGENT) | Giới hạn size file (config), whitelist mime-type |
| `/kb/documents` | GET | Query: status,tag,page | `PaginatedDto<DocumentResponseDto>` | Bearer | |
| `/kb/documents/:id` | DELETE | — | `{success:true}` | Bearer + Role(ADMIN) | Soft delete |
| `/kb/documents/:id/reprocess` | POST | — | `{success:true}` | Bearer + Role(ADMIN) | Re-trigger chunk+embed nếu FAILED |

## 11.3. Tickets

| Endpoint | Method | Request | Response | Auth | Validation |
|---|---|---|---|---|---|
| `/tickets` | POST | `CreateTicketDto{customerEmail,subject,content}` | `TicketResponseDto` | Public (API key cho kênh ngoài) hoặc Bearer nội bộ | Validate email format, content không rỗng; trigger `ProcessIncomingMessageUseCase` async |
| `/tickets` | GET | Query: status,priority,category,assignedAgentId,page,limit,sort | `PaginatedDto<TicketResponseDto>` | Bearer | CQRS Query side |
| `/tickets/:id` | GET | — | `TicketDetailResponseDto` (kèm timeline) | Bearer | 404 nếu không tồn tại |
| `/tickets/:id/messages` | POST | `AddMessageDto{content}` | `TicketMessageResponseDto` | Public/Bearer | Re-trigger AI pipeline nếu status=WAITING_CUSTOMER |
| `/tickets/:id/status` | PATCH | `UpdateStatusDto{status,reason}` | `TicketResponseDto` | Bearer + Role(AGENT/ADMIN) | Validate qua State Machine, 409 nếu transition không hợp lệ |
| `/tickets/:id/escalate` | POST | `EscalateDto{reason}` | `EscalationResponseDto` | Bearer + Role(AGENT) hoặc System | |

## 11.4. Conversation

| Endpoint | Method | Request | Response | Auth |
|---|---|---|---|---|
| `/conversations/:ticketId` | GET | — | `ConversationContextDto{turns[],summary}` | Bearer |

## 11.5. Escalations

| Endpoint | Method | Request | Response | Auth |
|---|---|---|---|---|
| `/escalations` | GET | Query: status,assignedAgentId | `PaginatedDto<EscalationResponseDto>` | Bearer + Role(AGENT/ADMIN) |
| `/escalations/:id/acknowledge` | POST | — | `EscalationResponseDto` | Bearer + Role(AGENT) |
| `/escalations/:id/resolve` | POST | `{resolutionNote}` | `EscalationResponseDto` | Bearer + Role(AGENT) |

## 11.6. Admin

| Endpoint | Method | Request | Response | Auth |
|---|---|---|---|---|
| `/admin/categories` | GET/POST | `CategoryDto` | `CategoryResponseDto[]` | Bearer + Role(ADMIN) |
| `/admin/routing-rules` | GET/POST/PATCH | `RoutingRuleDto` | `RoutingRuleResponseDto` | Bearer + Role(ADMIN) |
| `/admin/settings` | GET/PATCH | `{key,value}` | `SystemSettingResponseDto` | Bearer + Role(ADMIN) |
| `/admin/audit-logs` | GET | Query: resourceType,actorId,dateRange,page | `PaginatedDto<AuditLogResponseDto>` | Bearer + Role(ADMIN) |

## 11.7. Dashboard

| Endpoint | Method | Response | Auth |
|---|---|---|---|
| `/dashboard/overview` | GET | `OverviewStatsDto` (tổng ticket, theo status/priority) | Bearer + Role(AGENT/ADMIN) |
| `/dashboard/trends` | GET | `TrendDto[]` (theo ngày, query `from,to`) | Bearer |
| `/dashboard/ai-performance` | GET | `{avgConfidence, autoResolveRate, escalationRate}` | Bearer + Role(ADMIN) |

## 11.8. Monitoring

| Endpoint | Method | Response | Auth |
|---|---|---|---|
| `/health` | GET | `{status:"ok"}` | Public |
| `/health/ready` | GET | Kiểm tra DB/Redis reachable | Public (nội bộ orchestrator dùng) |
| `/metrics` | GET | Prometheus text format | Nội bộ (chặn qua network policy, không public) |

**Error Response chuẩn (áp dụng toàn hệ thống):**
```json
{
  "success": false,
  "error": {
    "code": "TICKET_INVALID_TRANSITION",
    "message": "Cannot transition ticket from RESOLVED to CLASSIFIED",
    "details": { "currentStatus": "RESOLVED", "targetStatus": "CLASSIFIED" }
  }
}
```
Mã lỗi (`code`) được định nghĩa tập trung ở `shared/exceptions/error-codes.ts`, map 1-1 sang HTTP status qua Global Exception Filter.

---

# 12. THIẾT KẾ BACKGROUND JOBS (BULLMQ WORKERS)

| Worker | Input | Output | Retry Strategy | Dead Letter Queue | Event Flow |
|---|---|---|---|---|---|
| **Document Parser Worker** | `DocumentUploadedEvent` → job `{documentId}` | text đã extract, tạo chunk thô | 3 lần, exponential backoff (2s/8s/32s) | Job vào queue `dlq:document-parser` sau khi hết retry, `status=FAILED`, thông báo Admin | → phát `DocumentParsedEvent` → enqueue Embedding Worker |
| **Embedding Worker** | `DocumentParsedEvent` → job `{documentId, chunkIds[]}` | `chunk_embeddings` records | 5 lần (API rate-limit dễ gặp), backoff dài hơn (5s/20s/60s/180s/300s) | `dlq:embedding`, giữ `status=PARTIALLY_EMBEDDED` để có thể resume | → `ChunksEmbeddedEvent`, `document.status=READY` |
| **Email Worker** | `EscalationCreatedEvent`, `SlaBreachedEvent`, `DocumentProcessingFailedEvent` → job `{notificationLogId}` | gửi email thật (SMTP free: Gmail SMTP/Resend free tier) | 3 lần, backoff cố định 10s | `dlq:email`, `status=FAILED` trong `notification_logs`, hiển thị ở Dashboard cho Admin retry thủ công | Cập nhật `notification_logs.status` |
| **Notification Worker** | Domain events cần thông báo in-app (mở rộng tương lai: websocket/push) | notification record | 3 lần | `dlq:notification` | tách khỏi Email Worker để đa kênh không chặn nhau |
| **Analytics Worker** | Cron (mỗi ngày 00:05) hoặc job thủ công `ComputeDailySnapshot` | `daily_metric_snapshot` record | 2 lần (job idempotent — tính lại an toàn) | `dlq:analytics` | Đọc Ticket/PromptLog, ghi snapshot cho Dashboard đọc nhanh |
| **Retry Worker** | Job từ các DLQ ở trên, được Admin trigger thủ công qua Dashboard hoặc cron quét DLQ định kỳ | re-enqueue vào queue gốc | Giới hạn số lần retry thủ công (tránh vòng lặp vô hạn), log mỗi lần retry vào `audit_logs` | — | Đảm bảo job lỗi tạm thời (rate-limit/network) không bị mất vĩnh viễn |
| **SLA Watcher Worker** | Cron (mỗi 5 phút), quét `escalations WHERE status=PENDING AND slaDeadline < now()` | `SlaBreachedEvent` | N/A (cron, không phải job retry theo nghĩa BullMQ) | — | → Notification Worker báo Admin |

**Nguyên tắc chung cho toàn bộ Worker:**
- Mọi Processor **idempotent** (chạy lại nhiều lần với cùng input không gây side-effect sai) — quan trọng vì BullMQ có thể redeliver job khi worker crash giữa chừng.
- Concurrency mỗi queue cấu hình riêng qua Settings/env (vd Embedding Worker concurrency thấp hơn để tôn trọng rate-limit API free tier).
- Mọi Processor chỉ gọi lại **Use Case đã định nghĩa ở Application layer** của module tương ứng — Processor không chứa business logic, chỉ là "adapter kích hoạt".

---

# 13. OBSERVABILITY

## 13.1. Health Check
- `/health` (liveness — process còn sống không)
- `/health/ready` (readiness — kiểm tra kết nối DB, Redis, thử ping LLM provider có key hợp lệ không)

## 13.2. Metrics (Prometheus — expose `/metrics` bằng `prom-client`)

| Nhóm | Metric | Loại |
|---|---|---|
| HTTP | `http_requests_total{method,route,status}` | Counter |
| HTTP | `http_request_duration_seconds{route}` | Histogram |
| Queue | `queue_job_duration_seconds{queue}` | Histogram |
| Queue | `queue_jobs_failed_total{queue}` | Counter |
| Queue | `queue_length{queue}` | Gauge |
| AI | `llm_call_duration_seconds{provider,useCase}` | Histogram |
| AI | `llm_call_errors_total{provider}` | Counter |
| AI | `ai_confidence_score` | Histogram (phân phối confidence để theo dõi chất lượng RAG theo thời gian) |
| Business | `tickets_created_total{category}` | Counter |
| Business | `tickets_escalated_total{reason}` | Counter |
| Business | `tickets_auto_resolved_total` | Counter |

## 13.3. Structured Logging
- Dùng `nestjs-pino` — log JSON có `requestId` (correlation id gắn qua Interceptor, propagate xuyên suốt use case → queue job qua job data), `userId`/`customerId` nếu có, `module`, `level`.
- Redact field nhạy cảm (password, token, PII khách hàng) tại logger config, không redact thủ công từng chỗ log (tránh sót).

## 13.4. Distributed Tracing (mức phù hợp Modular Monolith)
- Không cần full distributed tracing (Jaeger/Tempo) vì hiện tại 1 process — **nhưng** đã chuẩn bị sẵn cho tương lai: mọi request sinh `correlationId` (UUID) ngay tại Interceptor đầu vào, correlationId này được:
  - Gắn vào mọi log line liên quan đến request đó.
  - Gắn vào job data khi enqueue BullMQ job (để trace xuyên qua ranh giới async request → worker).
  - Gắn vào `prompt_logs`/`audit_logs`.
- Khi tách Microservices, chỉ cần thay logger correlation bằng OpenTelemetry Trace Context Propagation — không cần đổi cách đặt tên field.

## 13.5. Đề xuất Dashboard Grafana

1. **System Health Dashboard**: request rate, error rate, p95/p99 latency, queue length theo queue, DB connection pool usage.
2. **AI Performance Dashboard**: LLM latency theo provider, tỷ lệ lỗi/rate-limit theo provider, phân phối confidence score, tỷ lệ auto-resolve vs escalate theo thời gian.
3. **Business Dashboard**: số ticket theo category/priority theo ngày, thời gian phản hồi trung bình, SLA breach count.

---

# 14. KẾ HOẠCH TRIỂN KHAI THEO PHASE (07 NGÀY THEO ĐÚNG THỜI HẠN ĐỀ BÀI)

> Nguyên tắc: kiến trúc ở Mục 1-13 là **đầy đủ chuẩn Enterprise** và không đổi. Kế hoạch Phase dưới đây là cách **triển khai từng phần trong 7 ngày lịch** (24/07 – 31/07/2026) mà vẫn tôn trọng kiến trúc đó — module nào chưa kịp code đầy đủ Use Case thì vẫn có sẵn khung (interface, entity, folder) để mở rộng sau, KHÔNG phá vỡ ranh giới module. So với bản nháp 6 ngày trước đó, kế hoạch này thêm hẳn 1 ngày dành riêng cho hardening/testing/đóng gói hồ sơ nộp bài — tránh dồn cục vào ngày cuối như trước.
>
> **Quy tắc bắt buộc theo yêu cầu ban đầu:** không chuyển Phase tiếp theo nếu kiến trúc của Phase hiện tại chưa được xác nhận (approve). Thời lượng dưới đây tính cho **1 kỹ sư, ~8h/ngày**.

## Ngày 1 (24/07) — Phase 1 + Phase 2: Project Setup & Authentication

**Mục tiêu:** Bộ khung chạy được, có thể login.

**Công việc:**
- Khởi tạo monorepo (`apps/api`, `apps/worker`, `libs/*`), cấu hình NestJS + TypeScript strict mode.
- Docker Compose (Postgres + pgvector extension, Redis).
- Prisma schema khởi tạo + migration đầu (users, refresh_tokens).
- Shared Module (base classes, exception filter, Result type, pagination DTO).
- Config Module + env validation (Zod).
- Identity Module đầy đủ (login/refresh/logout, guard, RBAC decorator).

**Ước tính file:** ~35-40 file | **Deliverables:** `docker-compose up` chạy được API + DB + Redis; `POST /auth/login` hoạt động; test unit cho `AuthService`.

**Acceptance Criteria:** Login trả JWT hợp lệ; endpoint bảo vệ bởi Guard trả 401 khi thiếu token; `npm run test` pass cho Identity Module.

---

## Ngày 2 (25/07) — Phase 3 + Phase 4: Core Domain (Ticket/Customer/Conversation) & Knowledge Base

**Mục tiêu:** Tạo ticket được (qua kênh Web), quản lý State Machine, upload tài liệu được.

**Công việc:**
- Prisma schema đầy đủ toàn bộ bảng (Mục 10), bao gồm cột `channel` trên `tickets`.
- Customer Module (find-or-create).
- Ticket Module: Entity, Value Object, `TicketStateMachineService`, Use Case Command (Create/UpdateStatus/AddMessage), Query side cơ bản (list/detail), **`IChannelAdapter` port + `WebChannelAdapter`** (Mục 5.3).
- Conversation Module (append turn, get context — chưa cần summarize LLM ở bước này).
- Knowledge Base Module (upload, list, delete — chưa xử lý embedding).

**Ước tính file:** ~55-65 file | **Deliverables:** `POST /tickets` tạo ticket ở trạng thái `NEW` với `channel=WEB`; `PATCH /tickets/:id/status` chuyển trạng thái hợp lệ theo State Machine; `POST /kb/documents` upload file thành công (chưa chunk).

**Acceptance Criteria:** Transition không hợp lệ trả lỗi `409 TICKET_INVALID_TRANSITION`; `TicketStatusHistory` được ghi đúng mỗi lần đổi trạng thái.

---

## Ngày 3 (26/07) — Phase 5: RAG Pipeline (⭐ trọng tâm)

**Mục tiêu:** Pipeline RAG chạy end-to-end (upload → chunk → embed → retrieve → answer có citation).

**Công việc:**
- Infrastructure: `ILlmProvider`/`IEmbeddingProvider` port + Groq adapter + Gemini adapter (fallback) + Local embedding adapter (bge-small qua `@xenova/transformers`).
- BullMQ: Document Parser Worker, Embedding Worker.
- RAG Module: Chunking Service, Hybrid Search Service (vector + full-text), Re-ranking Service (bản đơn giản dùng LLM re-rank), Prompt Builder, Confidence Scoring.
- Enable `pgvector`, tạo index HNSW.

**Ước tính file:** ~40-45 file (phần nặng nhất — nếu trễ, ưu tiên cắt Re-ranking, giữ nguyên retrieval + generation cơ bản, ghi rõ vào Nhật ký quyết định — Mục 17)

**Deliverables:** Upload tài liệu → tự động có trạng thái `READY` sau khi Worker xử lý; gọi thử `RetrieveRelevantChunksUseCase` trả kết quả đúng theo semantic query.

**Acceptance Criteria:** Câu trả lời sinh ra có kèm citation trỏ đúng `documentId`; confidence score nằm trong khoảng [0,1] hợp lý; câu hỏi ngoài phạm vi tài liệu trả lời "không đủ thông tin" thay vì bịa (đúng yêu cầu đề bài về nhận biết giới hạn dữ liệu).

---

## Ngày 4 (27/07) — Phase 6 + Phase 7: AI Workflow (Classification/Spam/Duplicate/Missing Info/Priority) & Routing/Escalation

**Mục tiêu:** Toàn bộ workflow xử lý message tự động (Mục 8) chạy được end-to-end, đúng 8 nhóm yêu cầu nêu trong đề bài (hỏi đáp, khiếu nại, kỹ thuật, thanh toán, khẩn cấp, spam, trùng lặp, thiếu thông tin).

**Công việc:**
- AI Module: `ProcessIncomingMessageUseCase` (orchestrator), Classification/Spam/Duplicate/MissingInfo/Priority Services.
- Danh sách category mặc định (config-driven, chỉnh qua Settings/Admin): Hỏi đáp thông tin, Khiếu nại, Yêu cầu kỹ thuật, Yêu cầu thanh toán, Yêu cầu khẩn cấp — khớp trực tiếp với đề bài.
- PromptLog ghi lại mọi lời gọi LLM (async qua event).
- Routing Module (rule engine cơ bản, config qua `routing_rules` + Settings).
- Escalation Module (create/acknowledge/resolve), SLA field (chưa cần Watcher Worker đầy đủ nếu thiếu thời gian — có thể để job cron đơn giản).
- Nối `Ticket.create` → tự động trigger AI pipeline → cập nhật status theo kết quả.
- **Thêm kênh thứ 2 (Should have):** `ChatAppChannelAdapter` (Telegram Bot webhook) — chứng minh tính đa kênh của hệ thống cho video demo, tận dụng cùng pipeline đã có.

**Ước tính file:** ~50-55 file | **Deliverables:** Tạo ticket mới (qua Web hoặc Telegram) → tự động chuyển `CLASSIFIED` → `ANSWERED` (nếu confidence đủ) hoặc → `ESCALATED` (nếu không).

**Acceptance Criteria:** Ticket spam bị đóng tự động không qua Agent; ticket thiếu thông tin chuyển `WAITING_CUSTOMER` đúng; ticket confidence thấp có `Escalation` record được tạo kèm lý do + đủ bối cảnh hội thoại để Agent tiếp tục xử lý ngay (đúng yêu cầu đề bài về bàn giao đủ bối cảnh).

---

## Ngày 5 (28/07) — Phase 8 + Phase 9: Dashboard, Monitoring, Notification, Audit

**Mục tiêu:** Có thể "nhìn thấy" hệ thống đang hoạt động — Dashboard + Observability + Audit hoàn chỉnh, đúng yêu cầu đề bài về khả năng quan sát để đánh giá chất lượng và cải thiện quy trình.

**Công việc:**
- Audit Module (listener bắt hầu hết Domain Event quan trọng đã phát ra từ Ngày 1-4).
- Notification Module + Email Worker (SMTP free tier).
- Dashboard Module (overview/trends/ai-performance) — Analytics Worker tính snapshot cơ bản.
- Monitoring Module (`/health`, `/metrics` với `prom-client`).
- Frontend Next.js: trang login, danh sách ticket, chi tiết ticket + timeline, dashboard overview cơ bản.
- Docker Compose thêm Prometheus + Grafana, import dashboard mẫu.

**Ước tính file:** Backend ~25-30 file + Frontend ~25-30 file | **Deliverables:** Dashboard hiển thị số liệu thật từ dữ liệu đã tạo ở các ngày trước; Grafana hiển thị metrics cơ bản; Audit log có thể tra cứu qua `/admin/audit-logs`.

**Acceptance Criteria:** Tạo ticket mới → thấy phản ánh ngay trên Dashboard overview; Prometheus scrape thành công `/metrics`; Dashboard cho thấy rõ tỷ lệ AI tự trả lời vs escalate (thước đo chất lượng vận hành theo đúng tinh thần đề bài).

---

## Ngày 6 (29/07) — Phase 10: Hardening, Testing & Tự kiểm thử ("Thử lừa hệ thống")

**Mục tiêu:** Hệ thống ổn định, có test tối thiểu, đã tự kiểm thử các trường hợp biên trước khi quay video/nộp bài.

**Công việc:**
- Viết test unit cho các Use Case cốt lõi (Ticket State Machine, AI orchestrator với mock `ILlmProvider`), test integration cho Repository chính.
- Rà soát lại error handling toàn hệ thống (Global Exception Filter, error code đồng nhất).
- Seed dữ liệu mẫu (`prisma/seed.ts`): vài tài liệu KB mẫu, vài ticket mẫu, đủ để demo trực quan cho video.
- **Tự thử các case biên có chủ đích** (tinh thần tương tự yêu cầu "thử lừa hệ thống" ở Track C, áp dụng cho Track D để tăng độ tin cậy sản phẩm): gửi câu hỏi ngoài phạm vi KB (kỳ vọng "không đủ thông tin" thay vì bịa), gửi ticket thiếu thông tin liên tiếp (kỳ vọng đúng `WAITING_CUSTOMER`), gửi 2 ticket nội dung giống hệt nhau (kỳ vọng phát hiện trùng lặp), gửi nội dung rác/quảng cáo (kỳ vọng nhận diện spam), gửi câu hỏi mơ hồ/thiếu ngữ cảnh (kỳ vọng confidence thấp → escalate thay vì trả lời sai). Kết quả từng case ghi lại trong Mục 17 (Nhật ký quyết định) để đưa vào tài liệu bàn giao.
- Sửa lỗi phát hiện được từ bước tự kiểm thử.

**Ước tính file:** ~20-25 file (chủ yếu test) | **Deliverables:** Test suite pass; bảng kết quả tự kiểm thử 5 case biên.

**Acceptance Criteria:** Toàn bộ luồng chính (upload KB → tạo ticket → AI trả lời hoặc escalate → Agent xử lý → Dashboard cập nhật) chạy ổn định qua nhiều lần thử liên tiếp, không lỗi trạng thái.

---

## Ngày 7 (30/07 – 31/07, 23:59) — Phase 11: Deployment & Đóng gói hồ sơ nộp bài

**Mục tiêu:** Deploy public, hoàn thiện toàn bộ hồ sơ theo đúng checklist Phần 3 của đề bài, quay video, nộp bài trước hạn.

**Công việc:**
- Deploy: Backend + Postgres + Redis lên Render/Railway free tier; Frontend lên Vercel; cấu hình env production.
- README hướng dẫn cài đặt/khởi chạy (local qua Docker Compose + link bản deploy), kèm tóm tắt kiến trúc (trỏ về tài liệu này).
- Chuẩn bị dữ liệu mẫu + tài liệu hỗ trợ để nộp kèm (Mục 18).
- Hoàn thiện danh sách công cụ/model/API/nguồn tham khảo chính thành file riêng (Mục 18).
- Hoàn thiện Nhật ký quyết định & giới hạn đã biết (Mục 17) — đảm bảo trình bày trung thực phần đã làm/chưa làm, đúng tinh thần chấm điểm của GFT.
- Quay video giới thiệu sản phẩm (**tối đa 5 phút** — theo đúng giới hạn Phần 3, không phải Phần 1): demo luồng chính qua ít nhất 1 kênh thật, demo Dashboard, nêu ngắn gọn kiến trúc + giới hạn đã biết + hướng cải tiến.
- Kiểm tra khả năng truy cập của toàn bộ file/link trước khi nộp (yêu cầu bắt buộc của đề bài) — thử mở lại từng link ở trình duyệt ẩn danh/máy khác.
- Nộp bài qua nền tảng GFT cung cấp, trước 23:59 ngày 31/07/2026.

**Ước tính file:** ~10-15 file (chủ yếu config deploy + tài liệu) | **Deliverables:** URL public demo; video ≤5 phút; đầy đủ 7 hạng mục hồ sơ theo Phần 3 (Mục 18).

**Acceptance Criteria:** Mọi link/file mở được từ máy khác không cần quyền truy cập đặc biệt; video đúng thời lượng quy định; hồ sơ nộp thành công được hệ thống GFT ghi nhận trước hạn.

---

## 14.1. Bảng ưu tiên MoSCoW (nếu 7 ngày không đủ)

| Mức | Hạng mục |
|---|---|
| **Must have** | Ticket CRUD + State Machine, kênh Web hoạt động, RAG cơ bản (chunk/embed/retrieve/generate, chưa cần re-rank tinh vi), AI Workflow (Classification, Spam, Missing Info, Priority — Duplicate Detection có thể đơn giản hoá bằng so sánh similarity threshold thay vì rule phức tạp), Escalation cơ bản kèm đủ bối cảnh, Auth, Dashboard overview tối thiểu, README + video |
| **Should have** | Kênh thứ 2 (Telegram), Hybrid Search (Vector + Full-text), Re-ranking, SLA Watcher, Audit Log đầy đủ, Grafana Dashboard đẹp |
| **Could have** | Kênh Email, Conversation Summarization tự động, Notification đa kênh, Analytics snapshot theo cron, Agent workload-based assignment |
| **Won't have (giai đoạn này)** | Thực sự tách Microservices, OAuth/SSO, đa ngôn ngữ UI, mobile app riêng |

# 15. RỦI RO & GIỚI HẠN CỦA FREE TIER

| Rủi ro | Ảnh hưởng | Giải pháp thiết kế |
|---|---|---|
| Rate-limit LLM free tier (Groq/Gemini) | Request bị từ chối lúc demo cao điểm | `ILlmProvider` có fallback chain (Groq → Gemini), Retry Worker + backoff, cache câu trả lời cho câu hỏi trùng lặp (tương lai) |
| Free tier Render/Railway ngủ (cold start) khi không có traffic | Latency cao lần đầu | Health check `/health` dùng để "đánh thức", tài liệu README ghi rõ giới hạn này cho người review |
| Giới hạn RAM free tier khi chạy local embedding model | OOM nếu model quá lớn | Chọn `bge-small` (~130MB) thay vì model lớn hơn; batch size embedding nhỏ, cấu hình được |
| Free Postgres storage giới hạn | Không lưu được nhiều vector | Giới hạn số tài liệu demo, tài liệu ghi rõ đây là giả định của bài Assessment, kiến trúc scale được khi có ngân sách |
| Email free tier (Gmail SMTP) có giới hạn gửi/ngày | Notification thật có thể fail | Email Worker có DLQ, không chặn luồng nghiệp vụ chính nếu gửi mail lỗi |

---

> **Lưu ý phạm vi khi deploy thật:** Free tier PostgreSQL/Redis (Render/Railway) thường giới hạn 90 ngày hoặc dung lượng nhỏ — với chu kỳ chấm bài của Assessment thì đủ dùng, nhưng README cần ghi rõ giả định này để người review không hiểu nhầm là giới hạn thiết kế.

---

# 17. NHẬT KÝ QUYẾT ĐỊNH & GIỚI HẠN ĐÃ BIẾT (DECISION LOG)

> Đề bài nêu rõ GFT đánh giá cao việc **trình bày trung thực** những gì đã làm, chưa làm, và lý do dẫn đến quyết định trong quá trình thực hiện — mục này là nơi ghi lại các quyết định đó theo thời gian thực khi triển khai, để dùng trực tiếp khi viết tài liệu bàn giao và quay video. Điền dần trong quá trình code, không điền trước.

## 17.1. Mẫu ghi nhận (điền theo từng ngày)

| Ngày | Quyết định / Đánh đổi | Lý do | Ảnh hưởng |
|---|---|---|---|
| Ví dụ: Ngày 3 | Bỏ qua Re-ranking bằng cross-encoder, chỉ dùng Hybrid Search thô | Hết thời gian trong ngày, ưu tiên có pipeline chạy end-to-end hơn là tối ưu chất lượng retrieval | Chất lượng câu trả lời có thể kém hơn ở câu hỏi mơ hồ; đã ghi rõ trong README là hướng cải tiến tiếp theo |
| _(điền tiếp trong quá trình làm)_ | | | |

## 17.2. Danh sách hạng mục cần theo dõi & cập nhật trạng thái cuối cùng

- [ ] Kênh nào đã implement thật (Web/Telegram/Email) — kênh nào chỉ có Port/stub.
- [ ] Re-ranking có được implement hay chỉ dừng ở Hybrid Search thô.
- [ ] Duplicate Detection dùng rule đầy đủ hay chỉ threshold đơn giản.
- [ ] SLA Watcher có chạy tự động (cron) hay chỉ có field `slaDeadline` chưa có job quét.
- [ ] Analytics snapshot tính real-time hay đã materialize qua Worker.
- [ ] Kết quả 5 case tự kiểm thử ở Ngày 6 (Mục 14, Ngày 6) — case nào pass, case nào lộ giới hạn, đã sửa hay chưa.
- [ ] Test coverage thực tế đạt được (không cần 100%, ghi rõ % và phần nào chưa có test).
- [ ] Hướng cải tiến tiếp theo nếu có thêm thời gian (dùng trực tiếp cho phần cuối video demo).

---

# 18. CHECKLIST HỒ SƠ NỘP BÀI (THEO PHẦN 3 CỦA ĐỀ BÀI)

Đối chiếu trực tiếp với yêu cầu "Hồ sơ nộp bài cần bao gồm" của đề, để không thiếu hạng mục khi nộp:

- [ ] **Mã nguồn chương trình** — repo đầy đủ (backend `apps/api`, `apps/worker`, `libs/*`, frontend), kèm `.env.example`.
- [ ] **Tài liệu tóm tắt kiến trúc hệ thống** — dùng chính tài liệu này (có thể tóm tắt lại bản ngắn 1-2 trang trỏ về tài liệu đầy đủ, vì đây là bản chi tiết dùng nội bộ).
- [ ] **Hướng dẫn cài đặt/khởi chạy** — README: `docker-compose up`, chạy migration/seed, biến môi trường cần thiết (API key Groq/Gemini free — hướng dẫn cách tự lấy key free).
- [ ] **Video giới thiệu sản phẩm, tối đa 05 phút** — quay ở Ngày 7, demo luồng chính + Dashboard + nêu giới hạn/hướng cải tiến (lấy nội dung từ Mục 17).
- [ ] **Dữ liệu mẫu và tài liệu hỗ trợ** — file KB mẫu đã dùng để seed, vài ticket mẫu minh hoạ các case (spam, trùng lặp, thiếu thông tin, khẩn cấp).
- [ ] **Danh sách công cụ, mô hình, API và nguồn tham khảo chính** — liệt kê: NestJS, Prisma, pgvector, BullMQ/Redis, Groq (model cụ thể đang dùng), Gemini (model fallback), bge-small-en-v1.5 (embedding), Next.js, TailwindCSS, Prometheus/Grafana, Telegram Bot API (nếu dùng kênh chat), công cụ AI hỗ trợ code (ghi rõ đã dùng Claude/ChatGPT/Copilot ở mức nào — đề bài cho phép và khuyến khích minh bạch).
- [ ] **Đường dẫn sản phẩm đã triển khai** — URL backend (Render/Railway) + URL frontend (Vercel), đã kiểm tra truy cập được từ trình duyệt ẩn danh trước khi nộp.
- [ ] Kiểm tra lại **toàn bộ link/file mở được** (yêu cầu bắt buộc, làm ở cuối Ngày 7 trước khi nộp qua nền tảng GFT).

---

# 19. ĐỊNH NGHĨA "HOÀN THÀNH" & BƯỚC TIẾP THEO

## 19.1. Definition of Done cho tài liệu kiến trúc này
- [ ] Bạn (reviewer) đã đọc và **xác nhận (approve)** từng mục 1-13.
- [ ] Không còn câu hỏi mở về ranh giới module hay luồng dữ liệu chính.
- [ ] Đồng ý với việc rút gọn scope theo MoSCoW (Mục 14.1) cho khung thời gian 7 ngày.
- [ ] Đồng ý với cách tiếp cận đa kênh (Channel Adapter — Mục 5.3) và phạm vi kênh sẽ implement thật.

## 19.2. Bước tiếp theo (sau khi bạn xác nhận)
Tôi sẽ **không viết code ngay**. Bước tiếp theo đúng quy trình đã thống nhất:

1. Bạn xác nhận kiến trúc tổng thể (Mục 1-13) — có thể yêu cầu chỉnh sửa bất kỳ phần nào trước.
2. Sau khi chốt, tôi sẽ triển khai **chi tiết kỹ thuật cho Ngày 1 / Phase 1+2** (danh sách file cụ thể, nội dung `schema.prisma` đầy đủ, danh sách package cần cài) — vẫn ở dạng thiết kế, chưa code.
3. Chỉ khi bạn xác nhận chi tiết Phase 1+2, tôi mới bắt đầu sinh code thật cho Phase đó.
4. Lặp lại quy trình xác nhận cho từng Ngày/Phase tiếp theo.

**→ Bạn muốn tôi bắt đầu từ đâu?**
- (a) Chỉnh sửa/bổ sung phần nào trong tài liệu kiến trúc này trước, hoặc
- (b) Xác nhận toàn bộ và đi vào chi tiết triển khai Ngày 1 (Phase 1 + Phase 2)?

---
*Hết tài liệu — Technical Design Document Track D v1.1 — đã đối chiếu với đề bài gốc "BÀI TEST - VỊ TRÍ CHUYÊN VIÊN AI ỨNG DỤNG.md"*
