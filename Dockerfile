# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app

# Prisma 네이티브 바이너리 실행을 위한 Alpine 호환 라이브러리
RUN apk add --no-cache libc6-compat openssl

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Prisma 클라이언트 생성 (빌드 시점에 native binary 포함)
RUN npx prisma generate

RUN yarn build

# ── Stage 3: runner ────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 런타임에 필요한 파일만 복사
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# DB 데이터 디렉토리
RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
