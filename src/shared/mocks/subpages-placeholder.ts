/**
 * 목록 화면용 목 데이터(UI 전용).
 */

export type PcfCatalogRow = {
  id: string;
  productName: string;
  status: string;
  totalEmissionKgCO2e: string;
  updatedAt: string;
};

export type ActivityDataCatalogRow = {
  id: string;
  activityLabel: string;
  quantity: string;
  unit: string;
  updatedAt: string;
};

export type EmissionFactorCatalogRow = {
  id: string;
  emissionFactorRef: string;
  labelKo: string;
  sourceNoteKo: string;
  updatedAt: string;
};

export const pcfCatalogRows: readonly PcfCatalogRow[] = [
  {
    id: "pcf-01",
    productName: "유기농 쌀 라인 A",
    status: "초안",
    totalEmissionKgCO2e: "8.3",
    updatedAt: "2026-05-07",
  },
  {
    id: "pcf-02",
    productName: "친환경 포장재 B",
    status: "검토 요청",
    totalEmissionKgCO2e: "4.1",
    updatedAt: "2026-05-06",
  },
  {
    id: "pcf-03",
    productName: "배합 사료 블록 C",
    status: "승인됨",
    totalEmissionKgCO2e: "11.9",
    updatedAt: "2026-05-05",
  },
] as const;

export const activityDataCatalogRows: readonly ActivityDataCatalogRow[] = [
  {
    id: "ad-9001",
    activityLabel: "전력 소비량 (본사 건물)",
    quantity: "12400",
    unit: "kWh",
    updatedAt: "2026-05-07",
  },
  {
    id: "ad-9002",
    activityLabel: "원료 투입 (수지 배치 수)",
    quantity: "2.6",
    unit: "톤",
    updatedAt: "2026-05-06",
  },
  {
    id: "ad-9003",
    activityLabel: "물류 거리 (도로 입고 구간)",
    quantity: "120",
    unit: "km",
    updatedAt: "2026-05-06",
  },
] as const;

export const emissionFactorCatalogRows: readonly EmissionFactorCatalogRow[] = [
  {
    id: "ef-meta-001",
    emissionFactorRef: "EF-ELEC-KR-2025-01",
    labelKo: "한국 지역 평균 전력 계수",
    sourceNoteKo: "전력 활동량에 적용",
    updatedAt: "2026-04-20",
  },
  {
    id: "ef-meta-002",
    emissionFactorRef: "EF-RESIN-GLOBAL-V3",
    labelKo: "수지 계열 배경 데이터",
    sourceNoteKo: "원료 투입에 연결 가능",
    updatedAt: "2026-03-11",
  },
  {
    id: "ef-meta-003",
    emissionFactorRef: "EF-FREIGHT-EU-RD",
    labelKo: "유럽 도로 화물 강도",
    sourceNoteKo: "운송 활동량에 적용 예시",
    updatedAt: "2026-02-02",
  },
] as const;
