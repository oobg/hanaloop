import {
  type ActivityDataCatalogRow,
  activityDataCatalogRows,
} from "@/shared/mocks/subpages-placeholder";
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

import { DashboardTopBar } from "./dashboard-top-bar";

type ActivityDataCatalogPageProps = {
  rows?: readonly ActivityDataCatalogRow[];
};

export function ActivityDataCatalogPage({
  rows = activityDataCatalogRows,
}: ActivityDataCatalogPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <DashboardTopBar
        title="활동 데이터"
        description="배출 산출에 쓰이는 활동량을 정리합니다. 배출량 = 활동량 × 배출 계수 관계만 문구로 참고합니다."
      />
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>활동 데이터 목록</CardTitle>
          <CardDescription>
            활동 요약 수치와 단위·갱신일 예시입니다. 연동 후 실제 행으로
            바뀝니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              등록된 활동 데이터가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>행 식별</TableHead>
                  <TableHead>활동 내용</TableHead>
                  <TableHead className="text-right">수치</TableHead>
                  <TableHead>단위</TableHead>
                  <TableHead className="text-right">갱신일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell>{r.activityLabel}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {r.updatedAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
