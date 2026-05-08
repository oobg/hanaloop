# Architecture

## Application

### web

Web application.

Stack:

- Next.js 15
- React 19.2
- TypeScript 5.x
- Tailwind CSS 4.1
- Zustand 5
- Prisma 6
- SQLite (local)
- PostgreSQL (production)
- shadcn/ui
- Framer Motion

Architecture:

- App Router
- FSD-lite

Layers:

- app
- pages
- features
- entities
- shared

Rules:

- Avoid unnecessary layer separation for MVP
- Prefer simple and readable UI
- Avoid excessive animation
- Use consistent spacing and typography

---

## Runtime

- Node.js 24.11
- pnpm 10

---

## Database Policy

- Local development uses SQLite
- Production environment uses PostgreSQL
- Prisma schema should support both environments

---

## Shared Rules

- Shared TypeScript config
- Shared domain terminology
- Shared calculation rules

---

## Domain

- Business calculation logic must be isolated from UI components
- Frontend components must not contain emission calculation logic
- PCF calculation logic should be reusable across the application
