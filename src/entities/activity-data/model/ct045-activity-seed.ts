import { z } from "zod";

export const CT045_PRODUCT_CODE = "CT-045";
export const CT045_PRODUCT_NAME = "컴퓨터 화면";

export const activityTypeSchema = z.enum([
  "ELECTRICITY",
  "RAW_MATERIAL",
  "TRANSPORT",
]);

export const activityUnitSchema = z.enum(["kWh", "kg", "ton-km"]);

export const activityDataPrismaRequiredFields = [
  "productId",
  "date",
  "activityType",
  "description",
  "amount",
  "unit",
] as const;

export const ct045ActivitySeedRequiredFields = [
  "id",
  "productCode",
  "date",
  "activityType",
  "description",
  "amount",
  "unit",
] as const;

export const ct045ActivitySeedRowSchema = z.object({
  id: z.string().min(1),
  productCode: z.literal(CT045_PRODUCT_CODE),
  date: z.iso.date(),
  activityType: activityTypeSchema,
  description: z.string().min(1),
  amount: z.number().positive(),
  unit: activityUnitSchema,
});

export const ct045ActivitySeedSchema = z
  .array(ct045ActivitySeedRowSchema)
  .length(29);

export type ActivityType = z.infer<typeof activityTypeSchema>;
export type ActivityUnit = z.infer<typeof activityUnitSchema>;
export type Ct045ActivitySeedRow = z.infer<typeof ct045ActivitySeedRowSchema>;
export type ActivityDataPrismaRequiredField =
  (typeof activityDataPrismaRequiredFields)[number];
export type Ct045ActivitySeedRequiredField =
  (typeof ct045ActivitySeedRequiredFields)[number];

export const ct045ActivitySeedRows = [
  {
    id: "ct045-act-001",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-01-05",
    activityType: "RAW_MATERIAL",
    description: "LCD 패널 모듈",
    amount: 1.85,
    unit: "kg",
  },
  {
    id: "ct045-act-002",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-01-06",
    activityType: "RAW_MATERIAL",
    description: "알루미늄 프레임",
    amount: 0.64,
    unit: "kg",
  },
  {
    id: "ct045-act-003",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-01-07",
    activityType: "RAW_MATERIAL",
    description: "ABS 후면 하우징",
    amount: 0.92,
    unit: "kg",
  },
  {
    id: "ct045-act-004",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-01-08",
    activityType: "RAW_MATERIAL",
    description: "스틸 스탠드 부품",
    amount: 0.78,
    unit: "kg",
  },
  {
    id: "ct045-act-005",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-01-09",
    activityType: "RAW_MATERIAL",
    description: "PCB 조립품",
    amount: 0.21,
    unit: "kg",
  },
  {
    id: "ct045-act-006",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-01-10",
    activityType: "RAW_MATERIAL",
    description: "구리 배선",
    amount: 0.12,
    unit: "kg",
  },
  {
    id: "ct045-act-007",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-01-11",
    activityType: "RAW_MATERIAL",
    description: "강화 유리 커버",
    amount: 0.44,
    unit: "kg",
  },
  {
    id: "ct045-act-008",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-01-12",
    activityType: "RAW_MATERIAL",
    description: "포장 골판지",
    amount: 0.38,
    unit: "kg",
  },
  {
    id: "ct045-act-009",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-01-13",
    activityType: "RAW_MATERIAL",
    description: "완충재 EPS",
    amount: 0.16,
    unit: "kg",
  },
  {
    id: "ct045-act-010",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-01-14",
    activityType: "RAW_MATERIAL",
    description: "전원 어댑터 부품",
    amount: 0.33,
    unit: "kg",
  },
  {
    id: "ct045-act-011",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-02-03",
    activityType: "ELECTRICITY",
    description: "SMT 라인 전력 사용",
    amount: 2.4,
    unit: "kWh",
  },
  {
    id: "ct045-act-012",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-02-04",
    activityType: "ELECTRICITY",
    description: "LCD 조립 라인 전력 사용",
    amount: 3.1,
    unit: "kWh",
  },
  {
    id: "ct045-act-013",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-02-05",
    activityType: "ELECTRICITY",
    description: "외관 검사 설비 전력 사용",
    amount: 0.74,
    unit: "kWh",
  },
  {
    id: "ct045-act-014",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-02-06",
    activityType: "ELECTRICITY",
    description: "번인 테스트 전력 사용",
    amount: 1.85,
    unit: "kWh",
  },
  {
    id: "ct045-act-015",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-02-07",
    activityType: "ELECTRICITY",
    description: "클린룸 공조 배분 전력",
    amount: 1.2,
    unit: "kWh",
  },
  {
    id: "ct045-act-016",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-02-08",
    activityType: "ELECTRICITY",
    description: "포장 라인 전력 사용",
    amount: 0.42,
    unit: "kWh",
  },
  {
    id: "ct045-act-017",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-02-09",
    activityType: "ELECTRICITY",
    description: "창고 조명 배분 전력",
    amount: 0.31,
    unit: "kWh",
  },
  {
    id: "ct045-act-018",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-02-10",
    activityType: "ELECTRICITY",
    description: "품질 시험실 전력 사용",
    amount: 0.68,
    unit: "kWh",
  },
  {
    id: "ct045-act-019",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-03-02",
    activityType: "TRANSPORT",
    description: "LCD 패널 공급사 입고 운송",
    amount: 0.42,
    unit: "ton-km",
  },
  {
    id: "ct045-act-020",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-03-03",
    activityType: "TRANSPORT",
    description: "알루미늄 프레임 입고 운송",
    amount: 0.18,
    unit: "ton-km",
  },
  {
    id: "ct045-act-021",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-03-04",
    activityType: "TRANSPORT",
    description: "ABS 하우징 입고 운송",
    amount: 0.27,
    unit: "ton-km",
  },
  {
    id: "ct045-act-022",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-03-05",
    activityType: "TRANSPORT",
    description: "PCB 조립품 항공 대체 보정 운송",
    amount: 0.09,
    unit: "ton-km",
  },
  {
    id: "ct045-act-023",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-03-06",
    activityType: "TRANSPORT",
    description: "포장재 입고 운송",
    amount: 0.11,
    unit: "ton-km",
  },
  {
    id: "ct045-act-024",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-03-07",
    activityType: "TRANSPORT",
    description: "완제품 물류센터 이동",
    amount: 0.36,
    unit: "ton-km",
  },
  {
    id: "ct045-act-025",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-03-08",
    activityType: "TRANSPORT",
    description: "국내 고객사 납품 운송",
    amount: 0.28,
    unit: "ton-km",
  },
  {
    id: "ct045-act-026",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-03-09",
    activityType: "TRANSPORT",
    description: "반품 회수 평균 운송",
    amount: 0.04,
    unit: "ton-km",
  },
  {
    id: "ct045-act-027",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-03-10",
    activityType: "TRANSPORT",
    description: "서비스 부품 보충 운송",
    amount: 0.03,
    unit: "ton-km",
  },
  {
    id: "ct045-act-028",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-03-11",
    activityType: "TRANSPORT",
    description: "수출 항만 반입 운송",
    amount: 0.22,
    unit: "ton-km",
  },
  {
    id: "ct045-act-029",
    productCode: CT045_PRODUCT_CODE,
    date: "2026-03-12",
    activityType: "TRANSPORT",
    description: "수출 해상 간선 운송",
    amount: 3.65,
    unit: "ton-km",
  },
] as const satisfies readonly Ct045ActivitySeedRow[];

export const validatedCt045ActivitySeedRows =
  ct045ActivitySeedSchema.parse(ct045ActivitySeedRows);
