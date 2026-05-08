import type { EmissionScopeRow } from "@/shared/mocks/dashboard-placeholder";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

type EmissionOverviewProps = {
  rows: readonly EmissionScopeRow[];
};

export function EmissionOverview({ rows }: EmissionOverviewProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>배출량 개요</CardTitle>
        <CardDescription>
          GHG Scope 기준 분할 예시입니다. 수치는 MVP용 자리 채우기입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => (
          <div
            key={row.scopeLabel}
            className="border-border flex flex-col gap-2 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="space-y-1">
              <Badge variant="outline">{row.scopeLabel}</Badge>
              <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
                {row.note}
              </p>
            </div>
            <p className="text-foreground shrink-0 text-sm font-medium tabular-nums sm:text-right">
              모형화된 배출량 대비 {row.sharePercent}%
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
