# Hanaloop

Next.js 기반 PCF(Product Carbon Footprint) 대시보드 프로젝트입니다.

## Stack

- Next.js 16
- React 19.2
- TypeScript 5.x
- Tailwind CSS 4.1
- Prisma 6
- SQLite (local)
- PostgreSQL (production)
- Zustand 5
- shadcn/ui

## Architecture

- App Router
- FSD-lite architecture

## Commands

```sh
pnpm dev
pnpm build
pnpm lint
pnpm check-types
```

## Database Policy

- Local development: SQLite
- Production environment: PostgreSQL
