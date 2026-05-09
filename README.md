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
pnpm db:seed:ct045
```

## Database Policy

- Local development: SQLite
- Production environment: PostgreSQL

## Seed Data

`pnpm db:seed:ct045` loads the CT-045 product, 4 emission-factor rows, and 29
activity-data rows from `prisma/seed-ct045-activity-data.sql` into the local
SQLite database. The seed SQL is idempotent, so it can be run repeatedly after
the schema migration has been applied.
