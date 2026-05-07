# Architecture

## Monorepo

This project uses:

- Turborepo
- pnpm workspace

---

## Applications

### apps/client

Frontend application.

Stack:

- React 19.2
- Vite 8
- TypeScript 5.x
- Tailwind CSS 4.1
- Zustand 5
- React Router v7
- shadcn/ui
- Framer Motion

Architecture:

- FSD-lite

Layers:

- app
- pages
- features
- entities
- shared

Rules:

- Avoid unnecessary layer separation for MVP

---

### apps/server

Backend API server.

Stack:

- NestJS 11
- Prisma 6
- SQLite (local)
- PostgreSQL (production)

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
- API-first architecture

---

## Domain

Business calculation logic must be isolated from UI components.

Frontend components must not contain emission calculation logic.
