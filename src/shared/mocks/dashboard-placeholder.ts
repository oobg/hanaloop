/**
 * Placeholder data for the PCF dashboard UI only.
 * No calculation or business rules — static copy and numbers.
 */

export type SummaryMetric = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

export type EmissionScopeRow = {
  scopeLabel: string;
  sharePercent: number;
  note: string;
};

export type RecentActivityRow = {
  id: string;
  occurredAt: string;
  activityDataSummary: string;
  emissionFactorId: string;
  emissionKgCO2e: string;
};

export const summaryMetrics: readonly SummaryMetric[] = [
  {
    id: "total-emission",
    label: "총 배출량",
    value: "12.4",
    hint: "진행 중인 PCF 항목 기준 kgCO₂e",
  },
  {
    id: "pcf-count",
    label: "PCF",
    value: "8",
    hint: "검토 단계에 있는 PCF 수",
  },
  {
    id: "activity-data",
    label: "활동 데이터",
    value: "24",
    hint: "이번 기간에 수집된 행 수",
  },
  {
    id: "emission-factors",
    label: "배출 계수",
    value: "16",
    hint: "활동 데이터에 연결된 참조 수",
  },
] as const;

export const emissionOverviewByScope: readonly EmissionScopeRow[] = [
  {
    scopeLabel: "GHG Scope · 예시 A",
    sharePercent: 42,
    note: "이 MVP 화면에서 모형화된 배출량 중 비중이 가장 큽니다.",
  },
  {
    scopeLabel: "GHG Scope · 예시 B",
    sharePercent: 35,
    note: "활동 데이터 밀도가 높은 구간입니다. 다음에 배출 계수 적용 범위를 점검하세요.",
  },
  {
    scopeLabel: "GHG Scope · 예시 C",
    sharePercent: 23,
    note: "현재는 상대적으로 기여도가 작습니다.",
  },
] as const;

export const chartPlaceholderCaption =
  "PCF 관련 배출량 추이 차트가 이 영역에 표시됩니다.";

export const recentActivities: readonly RecentActivityRow[] = [
  {
    id: "act-001",
    occurredAt: "2026-05-07 09:40",
    activityDataSummary: "전력 사용 — 공급사 믹스 (A 사업장)",
    emissionFactorId: "EF-ELEC-KR-2025-01",
    emissionKgCO2e: "1.92",
  },
  {
    id: "act-002",
    occurredAt: "2026-05-06 14:05",
    activityDataSummary: "원료 사용 — 폴리머 레진 배치",
    emissionFactorId: "EF-RESIN-GLOBAL-V3",
    emissionKgCO2e: "3.74",
  },
  {
    id: "act-003",
    occurredAt: "2026-05-06 11:22",
    activityDataSummary: "운송 거리 — 입고 도로 운송 (120 km)",
    emissionFactorId: "EF-FREIGHT-EU-RD",
    emissionKgCO2e: "0.48",
  },
  {
    id: "act-004",
    occurredAt: "2026-05-05 08:58",
    activityDataSummary: "전력 사용 — 재생 PPA 구간",
    emissionFactorId: "EF-ELEC-PPA-WIND-02",
    emissionKgCO2e: "0.61",
  },
] as const;
