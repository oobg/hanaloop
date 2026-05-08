import {
  type EmissionFactorCatalogRow,
  emissionFactorCatalogRows,
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

type EmissionFactorCatalogPageProps = {
  rows?: readonly EmissionFactorCatalogRow[];
};

export function EmissionFactorCatalogPage({
  rows = emissionFactorCatalogRows,
}: EmissionFactorCatalogPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <DashboardTopBar
        title="배출 계수"
        description="활동량에 곱해지는 배출 계수를 참조합니다. 식별자(EF-*)는 예시이며 추후 데이터베이스와 연결됩니다."
      />
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>배출 계수 목록</CardTitle>
          <CardDescription>
            참조 코드, 설명, 출처 메모, 갱신일을 한 화면에서 모은 MVP
            예시입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              등록된 배출 계수가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>메타 식별</TableHead>
                  <TableHead>배출 계수 참조</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>출처·용도 메모</TableHead>
                  <TableHead className="text-right">갱신일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.emissionFactorRef}
                    </TableCell>
                    <TableCell>{r.labelKo}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[240px] text-sm">
                      {r.sourceNoteKo}
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
