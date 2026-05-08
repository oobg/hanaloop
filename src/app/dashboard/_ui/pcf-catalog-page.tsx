import {
  type PcfCatalogRow,
  pcfCatalogRows,
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

type PcfCatalogPageProps = {
  rows?: readonly PcfCatalogRow[];
};

export function PcfCatalogPage({ rows = pcfCatalogRows }: PcfCatalogPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <DashboardTopBar
        title="PCF"
        description="제품 단위 발자국 항목을 관리합니다. 아래 목록과 수치는 UI 자리 채우기용입니다."
      />
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>PCF 목록</CardTitle>
          <CardDescription>
            제품 이름, 진행 상태, 합계 배출량(kgCO₂e) 형태로 확인할 예시입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              등록된 PCF가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>항목 식별</TableHead>
                  <TableHead>제품 이름</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">
                    합계 배출량 (kgCO₂e)
                  </TableHead>
                  <TableHead className="text-right">갱신일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell>{r.productName}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.totalEmissionKgCO2e}
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
