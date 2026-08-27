# TRACK D — Automation Agent (Tổng đài Hỗ trợ Khách hàng Tự vận hành)

Monorepo **1 GitHub repo duy nhất** chứa toàn bộ hệ thống:

```
.
├── Automatio Agent BE/automation-agent/   # Backend: NestJS API + Worker (BullMQ), Prisma, RAG
├── Automation Agent FE/automation-agent-fe/ # Frontend: Next.js 14 Dashboard + Web Chat Widget
├── docker-compose.yml                     # Full-stack: postgres(pgvector)+redis+api+worker+frontend
├── knowledge/                             # Tài liệu tri thức nạp vào Knowledge Base
└── TDD-Track-D-AI-Customer-Support.md     # Thiết kế kiến trúc đầy đủ (TDD 10 ngày)
```

<!-- Thay <USERNAME>/<REPO> bằng repo thật sau khi tạo -->
[![CI](https://github.com/<USERNAME>/<REPO>/actions/workflows/ci.yml/badge.svg)](https://github.com/<USERNAME>/<REPO>/actions/workflows/ci.yml)
[![Docker (GHCR)](https://img.shields.io/badge/Docker-GHCR-2496ed?logo=docker&logoColor=white)](https://github.com/<USERNAME>/<REPO>/pkgs)

> CI/CD **tổng** hoạt động ở root (`./.github/workflows/ci.yml`, do GitHub Actions chỉ đọc thư mục root của repo). Bản CI con bên trong `Automatio Agent BE/.../.github` và `Automation Agent FE/.../.github` giữ lại để các project vẫn chạy CI độc lập nếu sau này tách repo; ở monorepo, GitHub **bỏ qua** các file `.github/workflows` lồng nhau.

## Chạy full-stack bằng Docker

```bash
cp .env.example .env        # điền JWT secrets + GROQ/GEMINI keys
docker compose up -d --build
```

- API: http://localhost:3000/api (health: `/api/health`)
- Frontend: http://localhost:3001
- Admin seed: `admin@example.com` / `ChangeMe123!` (nhớ đổi sau login)

> Lưu ý: `docker compose restart` **không đọc lại `.env`** — áp dụng thay đổi env thì phải `docker compose up -d` (recreate).

Chỉ cần hạ tầng khi dev local (`npm run start:dev` trong backend):

```bash
docker compose -f "Automatio Agent BE/automation-agent/docker/docker-compose.infra.yml" up -d
```

## Phát triển (npm orchestrate từ root)

Root có `package.json` điều phối 2 project — chạy mọi thứ từ 1 nơi:

```bash
npm run install:all       # install cả BE + FE
npm run lint              # lint:ci BE (fail cả warning) + lint FE
npm run typecheck         # tsc --noEmit BE + FE
npm run test              # Jest BE (unit)
npm run build             # build BE (api+worker) + FE (next build)
```

Muốn vào từng project làm việc sâu: `cd "Automatio Agent BE/automation-agent" && npm run start:dev` (xem README backend) hoặc `cd "Automation Agent FE/automation-agent-fe" && npm run dev`.

## CI/CD tổng (root `.github/workflows/ci.yml`)

| Job | Chạy gì |
|---|---|
| `backend-lint`, `backend-typecheck`, `backend-test`, `backend-build` | ESLint + tsc + Jest (coverage artifact) + Nest build api/worker |
| `frontend-lint`, `frontend-typecheck`, `frontend-build` | ESLint (next) + tsc + `next build` |
| `docker-build` | Smoke-build 3 images: API (`Dockerfile`), Worker (`Dockerfile.worker`), Frontend (`Dockerfile`) |
| `publish-docker` | Merge `main`: login GHCR → build & push `automation-agent`, `automation-agent-worker`, `automation-agent-frontend` (tag `sha-*` + `latest`) |
| `deploy-frontend` | (tùy chọn) Vercel — chạy tay qua **Actions → Workflow dispatch**, cần secrets `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` |

Dependabot tổng (`./.github/dependabot.yml`) theo dõi cả 2 project (npm) + 2 Dockerfile + GitHub Actions, gộp PR theo nhóm — PR luôn được CI kiểm tra trước khi merge.

## Kết nối kênh

- **Telegram**: đặt `TELEGRAM_BOT_TOKEN`; chạy local **không cần URL public** → `TELEGRAM_POLLING_ENABLED=true` (long-poll `getUpdates`, tự `deleteWebhook`). Deploy có URL public → để `false` + set webhook.
- **Gmail**: IMAP polling (`GMAIL_USER` + `GMAIL_APP_PASSWORD`) + gửi qua Gmail REST API (`GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN`) — chi tiết README backend.

## Nạp tài liệu vào Knowledge Base

Upload Markdown/PDF/DOCX qua `POST /api/kb/documents` (Worker parse + chunk + embedding tự động), hoặc đưa file vào `knowledge/` rồi thử bằng `POST /api/rag/query`. User Guide mẫu: [`knowledge/Tài-liệu-kiến-thức-shop-khach-hang.md`](knowledge/Tài-liệu-kiến-thức-shop-khach-hang.md).

## Tài liệu chi tiết

- [`TDD-Track-D-AI-Customer-Support.md`](TDD-Track-D-AI-Customer-Support.md) — thiết kế kiến trúc, REST API, database, quyết định đánh đổi, theo dõi tiến độ Phase.
- README từng project: [`Automatio Agent BE/.../README.md`](Automatio%20Agent%20BE/automation-agent/README.md), [`Automation Agent FE/.../README.md`](Automation%20Agent%20FE/automation-agent-fe/README.md).