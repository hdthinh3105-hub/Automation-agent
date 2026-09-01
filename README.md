# TRACK D â€” Automation Agent (Tá»•ng Ä‘Ã i Há»— trá»£ KhÃ¡ch hÃ ng Tá»± váº­n hÃ nh)

Monorepo **1 GitHub repo duy nháº¥t** chá»©a toÃ n bá»™ há»‡ thá»‘ng:

```
.
â”œâ”€â”€ backend/automation-agent/   # Backend: NestJS API + Worker (BullMQ), Prisma, RAG
â”œâ”€â”€ frontend/automation-agent-fe/ # Frontend: Next.js 14 Dashboard + Web Chat Widget
â”œâ”€â”€ docker-compose.yml                     # Full-stack: postgres(pgvector)+redis+api+worker+frontend
â”œâ”€â”€ knowledge/                             # TÃ i liá»‡u tri thá»©c náº¡p vÃ o Knowledge Base
â””â”€â”€ TDD-Track-D-AI-Customer-Support.md     # Thiáº¿t káº¿ kiáº¿n trÃºc Ä‘áº§y Ä‘á»§ (TDD 10 ngÃ y)
```

<!-- Thay <USERNAME>/<REPO> báº±ng repo tháº­t sau khi táº¡o -->
[![CI](https://github.com/<USERNAME>/<REPO>/actions/workflows/ci.yml/badge.svg)](https://github.com/<USERNAME>/<REPO>/actions/workflows/ci.yml)
[![Docker (GHCR)](https://img.shields.io/badge/Docker-GHCR-2496ed?logo=docker&logoColor=white)](https://github.com/<USERNAME>/<REPO>/pkgs)

> CI/CD **tá»•ng** hoáº¡t Ä‘á»™ng á»Ÿ root (`./.github/workflows/ci.yml`, do GitHub Actions chá»‰ Ä‘á»c thÆ° má»¥c root cá»§a repo). Báº£n CI con bÃªn trong `backend/.../.github` vÃ  `frontend/.../.github` giá»¯ láº¡i Ä‘á»ƒ cÃ¡c project váº«n cháº¡y CI Ä‘á»™c láº­p náº¿u sau nÃ y tÃ¡ch repo; á»Ÿ monorepo, GitHub **bá» qua** cÃ¡c file `.github/workflows` lá»“ng nhau.

## Cháº¡y full-stack báº±ng Docker

```bash
cp .env.example .env        # Ä‘iá»n JWT secrets + GROQ/GEMINI keys
docker compose up -d --build
```

- API: http://localhost:3000/api (health: `/api/health`)
- Frontend: http://localhost:3001
- Admin seed: `admin@example.com` / `ChangeMe123!` (nhá»› Ä‘á»•i sau login)

> LÆ°u Ã½: `docker compose restart` **khÃ´ng Ä‘á»c láº¡i `.env`** â€” Ã¡p dá»¥ng thay Ä‘á»•i env thÃ¬ pháº£i `docker compose up -d` (recreate).

Chá»‰ cáº§n háº¡ táº§ng khi dev local (`npm run start:dev` trong backend):

```bash
docker compose -f "backend/automation-agent/docker/docker-compose.infra.yml" up -d
```

## PhÃ¡t triá»ƒn (npm orchestrate tá»« root)

Root cÃ³ `package.json` Ä‘iá»u phá»‘i 2 project â€” cháº¡y má»i thá»© tá»« 1 nÆ¡i:

```bash
npm run install:all       # install cáº£ BE + FE
npm run lint              # lint:ci BE (fail cáº£ warning) + lint FE
npm run typecheck         # tsc --noEmit BE + FE
npm run test              # Jest BE (unit)
npm run build             # build BE (api+worker) + FE (next build)
```

Muá»‘n vÃ o tá»«ng project lÃ m viá»‡c sÃ¢u: `cd "backend/automation-agent" && npm run start:dev` (xem README backend) hoáº·c `cd "frontend/automation-agent-fe" && npm run dev`.

## CI/CD tá»•ng (root `.github/workflows/ci.yml`)

| Job | Cháº¡y gÃ¬ |
|---|---|
| `backend-lint`, `backend-typecheck`, `backend-test`, `backend-build` | ESLint + tsc + Jest (coverage artifact) + Nest build api/worker |
| `frontend-lint`, `frontend-typecheck`, `frontend-build` | ESLint (next) + tsc + `next build` |
| `docker-build` | Smoke-build 3 images: API (`Dockerfile`), Worker (`Dockerfile.worker`), Frontend (`Dockerfile`) |
| `publish-docker` | Merge `main`: login GHCR â†’ build & push `automation-agent`, `automation-agent-worker`, `automation-agent-frontend` (tag `sha-*` + `latest`) |
| `deploy-frontend` | (tÃ¹y chá»n) Vercel â€” cháº¡y tay qua **Actions â†’ Workflow dispatch**, cáº§n secrets `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` |

Dependabot tá»•ng (`./.github/dependabot.yml`) theo dÃµi cáº£ 2 project (npm) + 2 Dockerfile + GitHub Actions, gá»™p PR theo nhÃ³m â€” PR luÃ´n Ä‘Æ°á»£c CI kiá»ƒm tra trÆ°á»›c khi merge.

## Káº¿t ná»‘i kÃªnh

- **Telegram**: Ä‘áº·t `TELEGRAM_BOT_TOKEN`; cháº¡y local **khÃ´ng cáº§n URL public** â†’ `TELEGRAM_POLLING_ENABLED=true` (long-poll `getUpdates`, tá»± `deleteWebhook`). Deploy cÃ³ URL public â†’ Ä‘á»ƒ `false` + set webhook.
- **Gmail**: IMAP polling (`GMAIL_USER` + `GMAIL_APP_PASSWORD`) + gá»­i qua Gmail REST API (`GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN`) â€” chi tiáº¿t README backend.

## Náº¡p tÃ i liá»‡u vÃ o Knowledge Base

Upload Markdown/PDF/DOCX qua `POST /api/kb/documents` (Worker parse + chunk + embedding tá»± Ä‘á»™ng), hoáº·c Ä‘Æ°a file vÃ o `knowledge/` rá»“i thá»­ báº±ng `POST /api/rag/query`. User Guide máº«u: [`knowledge/TÃ i-liá»‡u-kiáº¿n-thá»©c-shop-khach-hang.md`](knowledge/TÃ i-liá»‡u-kiáº¿n-thá»©c-shop-khach-hang.md).

## TÃ i liá»‡u chi tiáº¿t

- [`TDD-Track-D-AI-Customer-Support.md`](TDD-Track-D-AI-Customer-Support.md) â€” thiáº¿t káº¿ kiáº¿n trÃºc, REST API, database, quyáº¿t Ä‘á»‹nh Ä‘Ã¡nh Ä‘á»•i, theo dÃµi tiáº¿n Ä‘á»™ Phase.
- README tá»«ng project: [`backend/.../README.md`](Automatio%20Agent%20BE/automation-agent/README.md), [`frontend/.../README.md`](Automation%20Agent%20FE/automation-agent-fe/README.md).