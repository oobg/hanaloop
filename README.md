# Hanaloop PCF Dashboard

제품별 탄소 발자국(PCF)을 계산하고 GHG Scope 분포를 시각화하는 대시보드입니다.

## 로컬 실행 (5단계)

```sh
# 1. 의존성 설치
pnpm install

# 2. 환경변수 설정 (.env 이미 포함되어 있음)
#    DATABASE_URL="file:./prisma/dev.db"

# 3. DB 스키마 생성
npx prisma db push

# 4. 시드 데이터 삽입 (CT-045 컴퓨터 화면 + 배출계수 4종 + 활동데이터 30건)
npx tsx prisma/seed.ts

# 5. 개발 서버 시작
pnpm dev
```

브라우저에서 `http://localhost:3000/dashboard` 접속

## 주요 기능

| 페이지 | 경로 | 기능 |
|--------|------|------|
| 대시보드 | `/dashboard` | 총 배출량 요약, 월별 바차트, 최근 활동 |
| PCF 계산 | `/dashboard/pcf` | 제품·기간 선택 → PCF 계산 → 차트·테이블 |
| 활동 데이터 | `/dashboard/activity-data` | 목록 조회, 수동 입력, Excel 임포트 |
| 배출계수 | `/dashboard/emission-factor` | 계수 목록, 신규 등록, 버전 이력 |

## 시스템 설계

### 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **차트**: Recharts 3 (BarChart, PieChart, ResponsiveContainer)
- **백엔드**: Next.js Route Handlers (API)
- **ORM**: Prisma 5 + SQLite (로컬) / PostgreSQL 호환 스키마
- **검증**: Zod
- **Excel 파싱**: xlsx

### 아키텍처

FSD-lite(Feature-Sliced Design lite) 구조를 채택했습니다.

```
src/
├── app/                        # Next.js App Router
│   ├── api/                    # Route Handlers
│   │   ├── activity-data/      # GET(목록) / POST(생성)
│   │   │   └── import/         # POST(Excel 임포트)
│   │   ├── emission-factors/   # GET / POST
│   │   │   └── [id]/           # PUT / DELETE
│   │   ├── pcf/
│   │   │   ├── calculate/      # POST(PCF 계산)
│   │   │   └── results/        # GET(결과 조회)
│   │   └── products/           # GET
│   └── dashboard/              # 대시보드 페이지
│       ├── _ui/                # 페이지 컴포넌트
│       ├── activity-data/
│       ├── emission-factor/
│       └── pcf/
├── entities/                   # 도메인 모델 + Zod 스키마
│   ├── activity-data/
│   ├── emission-factor/        # mapActivityDataToEmissionFactor 매핑 로직
│   └── product/
├── features/                   # UI 기능 단위
│   ├── activity-manual-entry/  # 수동 입력 폼
│   └── activity-upload/        # Excel 업로드
└── shared/
    ├── lib/prisma.ts            # Prisma 싱글톤
    └── ui/                     # shadcn/ui 컴포넌트
```

### PCF 계산 로직

```
emission(i) = activity_amount(i) × emission_factor_value(i)
PCF = Σ emission(i)   [기간 내 모든 활동 데이터]

Scope 분류:
  Scope 2 → activityType = ELECTRICITY (전기)
  Scope 3 → activityType = RAW_MATERIAL | TRANSPORT (원소재, 운송)
```

### 배출계수 자동 매핑

활동 데이터 입력 시 `activityType + description` 조합으로 가장 적합한 배출계수를 자동 선택합니다 (`mapActivityDataToEmissionFactor`). 일치하는 계수가 없으면 `emissionFactorId = null`로 저장됩니다.

## ERD

```
Product
  id         PK
  code       UNIQUE  ─── "CT-045"
  name
  createdAt / updatedAt

EmissionFactor
  id         PK
  factorKey  ─── "EF_ELECTRICITY_한국전력_기본값"
  version    INT
  activityType  ELECTRICITY | RAW_MATERIAL | TRANSPORT
  description
  value      Decimal
  unit       ─── "kgCO2e/kWh"
  scope      SCOPE_2 | SCOPE_3
  validFrom / validTo / createdAt / updatedAt
  UNIQUE(factorKey, version)

ActivityData
  id         PK
  productId  FK → Product.id
  emissionFactorId  FK? → EmissionFactor.id
  date
  activityType
  description
  amount     Decimal
  unit
  createdAt / updatedAt

PcfResult
  id         PK
  productId  FK → Product.id
  periodStart / periodEnd
  totalEmission  Decimal
  byScope    String  ─── JSON: {"SCOPE_2": 469.22, "SCOPE_3": 10603.5}
  byCategory String  ─── JSON: {"ELECTRICITY": 469.22, ...}
  calculatedAt / createdAt / updatedAt
  UNIQUE(productId, periodStart, periodEnd)
```

## AI 사용 내역

이 프로젝트는 **Ouroboros**(Anthropic Claude Code 플러그인)의 Specification-First 워크플로를 사용해 개발되었습니다.

### 워크플로

```
ooo interview → ooo seed → ooo run → 직접 구현
```

1. **`ooo interview`** — Socratic 인터뷰(10문항)로 요구사항 명확화
   - 배출계수 연결 방식(자동 매핑), PCF 트리거(수동 계산 버튼), Excel 컬럼 형식 등 7가지 가정을 검증
   - 모호성 점수 0.12까지 줄임

2. **`ooo seed`** — 인터뷰 결과를 실행 가능한 스펙(`.seed/hanaloop-pcf.seed.yaml`)으로 결정화
   - 11개 인수 기준, 3개 종료 조건 정의

3. **`ooo run`** — Codex API가 AC 3/11 완료 후 할당량 소진 → 직접 구현으로 전환

4. **직접 구현** — Claude Code가 나머지 8개 AC를 직접 구현:
   - Prisma 5 SQLite 호환 스키마 조정 (Json → String)
   - API Route Handlers (activity-data, emission-factors, pcf/calculate, products)
   - PCF 페이지 (Recharts 차트 3종 + 상세 테이블)
   - Excel 임포트 (xlsx 서버사이드 파싱)

### 주요 기술 결정 (AI 제안)

| 결정 | 이유 |
|------|------|
| Prisma 5 (not 6) | SQLite datasource `url` 호환성 |
| `byScope: String` | Prisma 5 SQLite Json 미지원 → JSON.stringify/parse |
| Product 조회 `OR [id, code]` | 프론트에서 code 문자열 전송 케이스 처리 |
| `(v: unknown) =>` Tooltip formatter | Recharts 타입 시그니처 준수 |
