import type { RecentActivityRow } from "@/shared/mocks/dashboard-placeholder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

type RecentActivityTableProps = {
  rows: readonly RecentActivityRow[];
};

export function RecentActivityTable({ rows }: RecentActivityTableProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>최근 활동</CardTitle>
        <CardDescription>
          최신 활동 데이터 행과 연결된 배출 계수, 그리고 결과
          배출량(kgCO₂e)입니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            표시할 활동 데이터가 없습니다.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시각</TableHead>
                <TableHead>활동 데이터</TableHead>
                <TableHead>배출 계수</TableHead>
                <TableHead className="text-right">배출량 (kgCO₂e)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {r.occurredAt}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate">
                    {r.activityDataSummary}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.emissionFactorId}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.emissionKgCO2e}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
