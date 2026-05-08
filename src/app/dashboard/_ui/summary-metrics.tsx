import type { SummaryMetric } from "@/shared/mocks/dashboard-placeholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

type SummaryMetricsProps = {
  metrics: readonly SummaryMetric[];
};

export function SummaryMetrics({ metrics }: SummaryMetricsProps) {
  return (
    <section
      aria-label="요약 지표"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {metrics.map((m) => (
        <Card key={m.id} className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {m.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            <p className="text-foreground text-2xl font-semibold tabular-nums tracking-tight">
              {m.value}
            </p>
            <p className="text-muted-foreground text-xs leading-snug">
              {m.hint}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
