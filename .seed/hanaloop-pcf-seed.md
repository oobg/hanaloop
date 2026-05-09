# Seed: Hanaloop PCF Dashboard

> Generated from interview on 2026-05-09

## Goal

탄소 관리 플랫폼의 핵심 기능을 구현한다: 활동 데이터 입력 → 배출계수 관리 → PCF 자동 계산 → 시각화 대시보드.
대상 사용자: 실무자(데이터 입력/검토), 경영자(요약/트렌드 확인).

## Decisions (from interview)

| 항목 | 결정 |
|------|------|
| DB | Prisma + SQLite (로컬), schema는 PostgreSQL 호환 |
| 차트 | Recharts |
| 제품 범위 | 다중 제품 (Product 엔티티, CT-045 시드 데이터) |
| 시각화 | 요약 카드 + 월별 바차트/라인차트 + 카테고리별 상세 |
| 배출계수 버전 | validFrom / validTo 날짜 필드 |
| 데이터 입력 | 수동 폼 + Excel(.xlsx) 임포트 |
| PCF 계산 위치 | Next.js API Route (서버사이드) |
| EF 연결 방식 | activityType + description 자동 매핑 (입력 폼에서 description 선택 시 EF 자동 연결) |
| PCF 계산 트리거 | PCF 페이지에서 "계산" 버튼 수동 클릭 → 기간 선택 후 실행 |
| Excel 임포트 | 제공된 Excel 형식 그대로 (과제용 데이터 시트 파싱, 보너스 점수 대상) |

## Domain Model

### GHG Scope 분류
- **Scope 2**: 전기 (electricity)
- **Scope 3**: 원소재 (raw materials), 운송 (transport)

### PCF 계산 공식
```
emission (kgCO₂e) = activity_amount × emission_factor_value
PCF_total = Σ emission_i (제품의 모든 활동 합계)
```

## Schema (Prisma)

```prisma
model Product {
  id          String         @id @default(cuid())
  code        String         @unique  // e.g. "CT-045"
  name        String
  createdAt   DateTime       @default(now())
  activities  ActivityData[]
  pcfResults  PcfResult[]
}

model EmissionFactor {
  id           String   @id @default(cuid())
  activityType String   // "전기" | "원소재" | "운송"
  description  String   // "한국전력 기본값" | "플라스틱 1" | ...
  unit         String   // "kWh" | "kg" | "ton-km"
  value        Float    // e.g. 0.456
  validFrom    DateTime
  validTo      DateTime?
  createdAt    DateTime @default(now())
}

model ActivityData {
  id             String         @id @default(cuid())
  productId      String
  product        Product        @relation(fields: [productId], references: [id])
  date           DateTime       // 활동 일자 (월 기준)
  activityType   String         // "전기" | "원소재" | "운송"
  description    String         // "한국전력" | "플라스틱 1" | "트럭"
  amount         Float
  unit           String
  createdAt      DateTime       @default(now())
}

model PcfResult {
  id              String   @id @default(cuid())
  productId       String
  product         Product  @relation(fields: [productId], references: [id])
  periodStart     DateTime
  periodEnd       DateTime
  totalEmission   Float    // kgCO₂e
  byScope         Json     // { scope2: Float, scope3: Float }
  byCategory      Json     // { 전기: Float, 원소재: Float, 운송: Float }
  calculatedAt    DateTime @default(now())
}
```

## Seed Data (CT-045 기반)

### 배출계수 (EmissionFactor)
| activityType | description | value | unit |
|---|---|---|---|
| 전기 | 한국전력 기본값 | 0.456 | kgCO₂e/kWh |
| 원소재 | 플라스틱 1 | 2.3 | kgCO₂e/kg |
| 원소재 | 플라스틱 2 | 3.2 | kgCO₂e/kg |
| 운송 | 트럭 | 3.5 | kgCO₂e/ton-km |

### 활동 데이터 (ActivityData, productId=CT-045)
전기(kWh): Jan110, Feb112, Mar115, Apr130, May120+101, Jun110, Jul120, Aug111
원소재-플라스틱1(kg): Jan230, Feb340, Mar430, Apr510, May424+232, Jun450, Jul340, Aug230
원소재-플라스틱2(kg): Mar23, May40, Jul43
운송-트럭(ton-km): Jan41, Feb211, Mar123, Apr42, May123+12, Jun123, Jul41, Aug123

## API Routes

| Method | Path | 역할 |
|---|---|---|
| GET | /api/products | 제품 목록 |
| POST | /api/products | 제품 생성 |
| GET | /api/activity-data?productId=&month= | 활동 데이터 조회 |
| POST | /api/activity-data | 단건 입력 |
| POST | /api/activity-data/import | Excel 일괄 임포트 |
| GET | /api/emission-factors | 배출계수 목록 |
| POST | /api/emission-factors | 배출계수 생성 |
| PUT | /api/emission-factors/[id] | 배출계수 수정 |
| POST | /api/pcf/calculate | PCF 계산 트리거 |
| GET | /api/pcf/results?productId= | PCF 결과 조회 |

## Pages

### /dashboard (메인)
- 요약 카드: 총 PCF, Scope 2, Scope 3, 데이터 건수
- 월별 바차트 (Recharts): 카테고리별 누적 배출량
- 최근 활동 데이터 테이블

### /dashboard/activity-data
- 활동 데이터 목록 테이블 (제품 필터, 월 필터)
- 신규 입력 폼 (validation + 에러 메시지)
- Excel 임포트 버튼 (drag & drop)

### /dashboard/emission-factor
- 배출계수 목록 (현재 유효한 것만 / 전체 이력 토글)
- 신규/수정 폼 (validFrom, validTo 포함)

### /dashboard/pcf
- 제품 선택 드롭다운
- PCF 결과 카드 (총량, 카테고리별)
- 월별 트렌드 라인차트
- 카테고리 파이차트 (Scope 2 vs Scope 3)

## Implementation Order

1. `pnpm add prisma @prisma/client recharts xlsx` + init schema
2. Prisma seed (CT-045 데이터 + 배출계수)
3. API Routes: activity-data CRUD + Excel import
4. API Routes: emission-factor CRUD
5. API Routes: PCF calculate + results
6. UI: 활동 데이터 페이지 (폼 + 임포트)
7. UI: 배출계수 페이지
8. UI: PCF 결과 페이지 (Recharts)
9. UI: 메인 대시보드 (요약 카드 + 월별 차트)
10. README 작성

## Checklist (from assignment)

- [ ] PCF 계산 결과 시각화, 의미 명확
- [ ] 데이터 값 정확, 단위 표시 적절
- [ ] 데이터 입력 시 오류 에러 메시지
- [ ] README: 로컬 실행 5단계 이내
- [ ] README: AI 도구 사용 내역
- [ ] README: 시스템 설계 설명
- [ ] GitHub public + 커밋 히스토리
- [ ] (권장) ERD in README
- [ ] (보너스) Excel 직접 임포트
