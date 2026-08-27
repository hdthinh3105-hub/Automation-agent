# Automation Agent — Dashboard (Frontend) (Link Demo: https://automation-agent-fe.vercel.app)

[![CI](https://github.com/hdthinh3105-hub/automation-agent-FE/actions/workflows/ci.yml/badge.svg)](https://github.com/hdthinh3105-hub/automation-agent-FE/actions/workflows/ci.yml)
[![Next](https://img.shields.io/badge/Next.js-14.2-000000?logo=nextdotjs&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)]()
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)]()

Frontend Dashboard cho hệ thống **Automation Agent** (AI Customer Support Automation) — nơi Agent/Admin quan sát và vận hành hệ thống: theo dõi ticket, xem hội thoại AI/khách hàng, đổi trạng thái theo đúng State Machine, và xem số liệu tổng quan/xu hướng. Đi kèm 1 **Web Chat Widget** public để khách hàng gửi yêu cầu mà không cần tài khoản — đúng kênh "Web" (Must-have) trong thiết kế đa kênh của backend.

> Frontend này là "cửa sổ quan sát" cho backend `automation-agent` — mọi logic nghiệp vụ (AI pipeline, RAG, State Machine, RBAC) nằm ở backend; frontend chỉ gọi REST API và trình bày lại đúng những gì backend cho phép (vd bảng ma trận transition được đồng bộ tay từ `TicketStatus` của backend, chỉ phục vụ UX — backend vẫn là nơi validate thật, trả 409 nếu FE lỡ gửi sai).

---

## Mục lục

- [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
- [Tech Stack](#tech-stack)
- [Tính năng chính](#tính-năng-chính)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Cài đặt & Chạy thử](#cài-đặt--chạy-thử)
- [Biến môi trường](#biến-môi-trường)
- [Xác thực & Bảo mật](#xác-thực--bảo-mật)
- [Testing & CI/CD](#testing--cicd)
- [Giới hạn đã biết](#giới-hạn-đã-biết)
- [Tài liệu liên quan](#tài-liệu-liên-quan)

---

## Kiến trúc tổng quan

```
┌────────────────────────────────────────────────────────────────┐
│                     Next.js 14 (App Router)                    │
│                                                                │
│  Public routes (không AuthProvider redirect)                   │
│  ├── /login                    — đăng nhập Agent/Admin         │
│  └── /chat, /chat/[id]         — Web Chat Widget (khách hàng)  │
│                                                                │
│  Protected routes — route group (dashboard)/                   │
│  ├── /dashboard                — tổng quan, xu hướng           │
│  └── /tickets, /tickets/[id]   — danh sách + chi tiết ticket   │
│                                                                │
│  lib/api-client.ts — fetch wrapper: gắn Bearer token, tự parse │
│  envelope {success,data,error}, tự refresh token 1 lần khi 401 │
│  lib/auth-context.tsx — React Context quản lý phiên đăng nhập  │
└───────────────────────────┬────────────────────────────────────┘
                            │ REST (JWT Bearer)
                            ▼
                 Backend automation-agent (NestJS API)
```

**Nguyên tắc thiết kế:**
- **Route groups** phân tách rõ khu vực public (`/chat`, `/login`) và khu vực cần đăng nhập (`(dashboard)/*`) — `AuthProvider` chỉ redirect về `/login` cho layout nằm trong route group `(dashboard)`.
- **API Client tập trung** (`lib/api-client.ts`): mọi page/hook đều gọi qua `apiFetch<T>()`, tự động gắn `Authorization: Bearer`, tự parse envelope chuẩn của backend, và tự thử refresh token đúng 1 lần khi gặp 401 trước khi bắt buộc đăng xuất.
- **Đồng bộ hoá State Machine với backend chỉ để cải thiện UX**: `lib/ticket-transitions.ts` copy nguyên ma trận transition từ Domain layer của backend (`TicketStatus` VO) — chỉ dùng để ẩn/hiện lựa chọn hợp lệ trên UI, backend vẫn luôn là nguồn sự thật (409 nếu 2 bên lệch nhau do quên đồng bộ).
- **Polling đơn giản cho Web Chat**: kênh Web chưa có WebSocket ở phạm vi hiện tại — trang chat khách hàng poll lại ticket mỗi 4 giây để cập nhật câu trả lời AI/Agent.

---

## Tech Stack

| Nhóm | Công nghệ | Vai trò |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/CSR kết hợp, routing theo thư mục, route groups |
| Ngôn ngữ | TypeScript (strict) | Type-safe end-to-end với DTO của backend |
| UI | TailwindCSS | Styling utility-first, custom theme màu `brand` |
| State/Auth | React Context (`AuthProvider`) + `localStorage` | Lưu access/refresh token phía client |
| HTTP | `fetch` API thuần, bọc qua `lib/api-client.ts` | Không dùng thêm thư viện HTTP client ngoài |
| Deployment | Vercel (khuyến nghị) hoặc bất kỳ Node host nào hỗ trợ Next.js | Free tier đủ cho demo |

---

## Tính năng chính

### Dashboard (Agent/Admin — cần đăng nhập)
- **Tổng quan** (`/dashboard`): tổng số ticket, tỷ lệ AI tự trả lời, tỷ lệ chuyển Agent, confidence trung bình (Admin only — tự bỏ qua nếu Agent gặp 403), phân bố theo trạng thái/mức ưu tiên, bảng xu hướng 30 ngày gần nhất.
- **Danh sách Ticket** (`/tickets`): filter theo trạng thái + mức ưu tiên, phân trang, hiển thị kênh tiếp nhận (Web/Email/Chat App/Internal).
- **Chi tiết Ticket** (`/tickets/:id`): thông tin đầy đủ (khách hàng, kênh, danh mục, confidence score, cờ thiếu thông tin), toàn bộ hội thoại (Customer/AI/Agent), lịch sử chuyển trạng thái dạng timeline, và **form đổi trạng thái chỉ hiện các lựa chọn hợp lệ** theo đúng State Machine của backend — kèm bảng ma trận transition đầy đủ để Agent tra cứu nhanh.

### Web Chat Widget (Khách hàng — public, không cần tài khoản)
- `/chat`: form gửi yêu cầu (email, tên tuỳ chọn, tiêu đề, nội dung) → tạo ticket qua kênh Web.
- `/chat/:id`: giao diện chat, hiển thị trạng thái xử lý bằng tiếng Việt dễ hiểu (`Đang phân loại`, `Đã chuyển cho nhân viên hỗ trợ`...), phân biệt bong bóng chat theo người gửi (Khách/AI/Agent), poll lại mỗi 4 giây để nhận câu trả lời mới mà không cần WebSocket.

### Đăng nhập & Phiên làm việc
- `/login`: đăng nhập bằng email/password, lưu access + refresh token.
- Tự động refresh access token khi hết hạn (401) — chỉ thử lại đúng 1 lần để tránh vòng lặp vô hạn, sau đó buộc đăng xuất và điều hướng về `/login`.
- Sidebar hiển thị email + role hiện tại (ADMIN/AGENT/VIEWER), nút Đăng xuất (best-effort gọi API revoke, không chặn UI).

### Trang Cài đặt hệ thống (`/settings` — Admin)
- **Hệ thống**: danh sách + thêm/sửa/xóa `SystemSetting` (value dạng JSON hoặc text), lọc theo danh mục.
- **Danh mục**: quản lý category dùng cho phân loại ticket (thêm / vô hiệu hóa).
- **Quy tắc định tuyến**: CRUD routing rule (AUTO_ANSWER / ASK_MORE_INFO / ESCALATE, priority, conditions JSON).

---

## Cấu trúc thư mục

```
automation-agent-FE/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar + AuthProvider redirect guard
│   │   ├── dashboard/page.tsx  # Tổng quan + xu hướng
│   │   ├── settings/page.tsx   # Cài đặt hệ thống (Settings/Categories/Routing Rules)
│   │   └── tickets/
│   │       ├── page.tsx        # Danh sách ticket (filter + pagination)
│   │       └── [id]/page.tsx   # Chi tiết ticket + đổi trạng thái + timeline
│   ├── chat/
│   │   ├── page.tsx            # Form tạo ticket (Web Chat Widget)
│   │   └── [id]/page.tsx       # Giao diện chat + polling
│   ├── login/page.tsx
│   ├── layout.tsx              # Root layout, bọc AuthProvider
│   └── globals.css
├── components/
│   ├── status-badge.tsx        # Badge màu theo TicketStatus/PriorityLevel
│   ├── transition-table.tsx    # Bảng ma trận transition (đối chiếu TDD Mục 9)
│   ├── stat-card.tsx           # Thẻ số liệu Dashboard
│   └── trend-table.tsx         # Bảng xu hướng theo ngày
├── lib/
│   ├── api-client.ts           # fetch wrapper: token, envelope, auto-refresh
│   ├── auth-context.tsx        # React Context quản lý phiên đăng nhập
│   ├── ticket-transitions.ts   # Ma trận transition (copy từ backend Domain)
│   └── types.ts                # DTO dùng chung với backend
├── .env.local.example
├── tailwind.config.ts
└── package.json
```

---

## Cài đặt & Chạy thử

### Yêu cầu
- Node.js ≥ 18.17
- Backend `automation-agent` đã chạy (xem README của project backend)

### Chạy local (dev)
```bash
git clone <repo-url> automation-agent-fe
cd automation-agent-fe
npm install

cp .env.local.example .env.local
# → NEXT_PUBLIC_API_BASE_URL trỏ đúng về backend, mặc định http://localhost:3000/api

npm run dev
```

Frontend chạy tại `http://localhost:3001` (đã cấu hình sẵn port trong `package.json` để không đụng port 3000 của backend).

### Build production
```bash
npm run build
npm run start
```

### Tài khoản thử nhanh
Dùng tài khoản admin đã seed ở backend: `admin@example.com` / `ChangeMe123!` (đổi mật khẩu sau lần đăng nhập đầu tiên).

---

## Biến môi trường

| Biến | Mô tả | Mặc định |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL gốc REST API của backend (đã bao gồm prefix `/api`) | `http://localhost:3000/api` |

Chỉ 1 biến môi trường công khai — không có secret nào ở phía frontend (JWT được backend ký, frontend chỉ lưu và gửi kèm request).

---

## Xác thực & Bảo mật

- Access token (JWT, hạn ngắn) + Refresh token (rotation) lưu tại `localStorage` — đủ dùng cho phạm vi demo/nội bộ; sản phẩm thật nên cân nhắc `httpOnly cookie` để giảm rủi ro XSS đọc token.
- Mọi route trong `(dashboard)/*` được bảo vệ bởi `AuthProvider` — chưa đăng nhập sẽ tự động điều hướng về `/login`.
- Trang `/tickets/:id/public` (backend) dùng để Web Chat Widget đọc lại hội thoại **không cần JWT** — bảo mật dựa trên việc `ticketId` là UUID không đoán được, không phải xác thực thật (ghi rõ là giới hạn đã biết ở phía backend).
- RBAC hiển thị theo role trả về từ backend: nút/khu vực chỉ dành cho ADMIN (vd đổi trạng thái, xem `ai-performance`) tự ẩn hoặc bỏ qua lỗi 403 một cách êm ái thay vì hiện lỗi toàn trang.

---

## Testing & CI/CD

```bash
npm run lint        # ESLint (next/core-web-vitals)
npm run typecheck   # tsc --noEmit
npm run build       # next build — build production (thuộc CI)
```

GitHub Actions tự chạy mỗi lần push `main`/PR (xem `.github/workflows/ci.yml`):

| Bước | Lệnh | Vai trò |
|---|---|---|
| `lint` | `npm run lint` | ESLint — bắt lỗi import, hooks, a11y |
| `typecheck` | `npm run typecheck` | TypeScript strict |
| `build` | `npm run build` | Build production + smoke-build Docker image, upload artifact `.next/` |

- **Deploy Vercel** (tuỳ chọn, xem `.github/workflows/deploy.yml`): chạy tay bằng **Actions → Deploy Vercel → Run workflow**. Cần set 3 secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` và chạy `npx vercel link` 1 lần ở local (commit `.vercel/project.json`). Chưa set secrets thì job tự bỏ qua, không fail.
- **Dependabot** cập nhật theo nhóm (next/react/typescript/tailwind, Docker, GitHub Actions) — ưu tiên review qua CI.

---

## Giới hạn đã biết

- **Chưa có WebSocket/real-time** — trang chat khách hàng dùng polling 4 giây; Dashboard không tự cập nhật khi có ticket mới (cần refresh thủ công).
- **Token lưu `localStorage`** thay vì `httpOnly cookie` — đủ an toàn cho demo/nội bộ nhưng có rủi ro XSS lý thuyết cao hơn cookie.
- **Chưa có trang quản trị Knowledge Base / Audit Log** trên UI dù backend đã có API (`/kb/documents`, `/admin/audit-logs`) — hiện thao tác qua Postman/API trực tiếp; riêng Settings/Categories/Routing Rules đã có ở `/settings`.
- **Chưa có unit test tự động cho FE** — CI hiện kiểm tra lint + typecheck + build; đây là điểm nên bổ sung tiếp.
- **Bảng ma trận transition ở frontend là bản copy tay** từ Domain layer backend — nếu backend thay đổi `VALID_TICKET_TRANSITIONS` mà quên đồng bộ, UI có thể cho phép chọn 1 transition rồi vẫn nhận lỗi 409 từ backend (backend luôn là nguồn sự thật cuối cùng).

---

## Tài liệu liên quan

- Backend `automation-agent` — README riêng của project backend, bao gồm kiến trúc đầy đủ, REST API, và `TDD-Track-D-AI-Customer-Support.md`- https://docs.google.com/document/d/1oIeRXqzTY-ehi3EKFmMDApNStNUflb6mWudEdIbrFOU/edit?usp=sharing (tài liệu thiết kế chi tiết mà UI này bám theo, đặc biệt Mục 9 — Ticket State Machine, và Mục 11 — Thiết kế REST API).
