import {
  chartPlaceholderCaption,
  emissionOverviewByScope,
  recentActivities,
  summaryMetrics,
} from "@/shared/mocks/dashboard-placeholder";

import { ChartPlaceholder } from "./chart-placeholder";
import { DashboardTopBar } from "./dashboard-top-bar";
import { EmissionOverview } from "./emission-overview";
import { RecentActivityTable } from "./recent-activity-table";
import { SummaryMetrics } from "./summary-metrics";

export function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <DashboardTopBar
        title="대시보드"
        description="PCF 업무 현황을 한눈에 봅니다. 활동 데이터 범위, 배출 계수 참조, kgCO₂e 단위 배출량을 요약합니다."
      />
      <SummaryMetrics metrics={summaryMetrics} />
      <section
        className="grid gap-6 lg:grid-cols-5"
        aria-labelledby="emission-exploration-heading"
      >
        <h2 id="emission-exploration-heading" className="sr-only">
          배출량 탐색
        </h2>
        <div className="space-y-6 lg:col-span-3">
          <ChartPlaceholder caption={chartPlaceholderCaption} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <EmissionOverview rows={emissionOverviewByScope} />
        </div>
      </section>
      <RecentActivityTable rows={recentActivities} />
    </div>
  );
}
