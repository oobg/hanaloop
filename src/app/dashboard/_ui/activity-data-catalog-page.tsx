"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Upload, RefreshCw } from "lucide-react";

import { ActivityDataManualForm } from "@/features/activity-manual-entry/ui/activity-data-manual-form";
import { ExcelUploadCard } from "@/features/activity-upload/ui/excel-upload-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DashboardTopBar } from "./dashboard-top-bar";

const ACTIVITY_LABELS: Record<string, string> = {
  ELECTRICITY: "전기",
  RAW_MATERIAL: "원소재",
  TRANSPORT: "운송",
};

const SCOPE_LABELS: Record<string, string> = {
  ELECTRICITY: "Scope 2",
  RAW_MATERIAL: "Scope 3",
  TRANSPORT: "Scope 3",
};

type ActivityRow = {
  id: string;
  date: string;
  activityType: string;
  description: string;
  amount: string;
  unit: string;
  emissionFactor: { value: string; unit: string } | null;
  product: { code: string };
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 3 }).format(n);

export function ActivityDataCatalogPage() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form" | "upload">("list");

  const refresh = useCallback(() => {
    setLoading(true);
    fetch("/api/activity-data")
      .then((r) => r.json())
      .then((d: { ok: boolean; data: ActivityRow[] }) => {
        if (d.ok) setRows(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <DashboardTopBar
        title="활동 데이터"
        description="제품별 전기·원소재·운송 활동량을 관리합니다. GHG 배출계수와 자동 연결됩니다."
      />

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={view === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => { setView("list"); refresh(); }}
        >
          목록
        </Button>
        <Button
          variant={view === "form" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("form")}
        >
          <Plus className="size-4 mr-1" />수동 입력
        </Button>
        <Button
          variant={view === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("upload")}
        >
          <Upload className="size-4 mr-1" />Excel 임포트
        </Button>
      </div>

      {view === "form" && <ActivityDataManualForm />}
      {view === "upload" && <ExcelUploadCard />}

      {view === "list" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>활동 데이터 목록</CardTitle>
                <CardDescription>전체 {rows.length}건</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="text-muted-foreground text-sm py-6 text-center">불러오는 중...</p>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground text-sm py-6 text-center">
                활동 데이터가 없습니다. 수동 입력 또는 Excel 임포트를 이용하세요.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="py-2 pr-3">날짜</th>
                    <th className="py-2 pr-3">제품</th>
                    <th className="py-2 pr-3">유형</th>
                    <th className="py-2 pr-3">설명</th>
                    <th className="py-2 pr-3 text-right">활동량</th>
                    <th className="py-2 text-right">배출계수</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-1.5 pr-3 tabular-nums text-muted-foreground">
                        {row.date.slice(0, 10)}
                      </td>
                      <td className="py-1.5 pr-3">
                        <span className="font-mono text-xs">{row.product?.code ?? "—"}</span>
                      </td>
                      <td className="py-1.5 pr-3">
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="outline">{ACTIVITY_LABELS[row.activityType] ?? row.activityType}</Badge>
                          <span className="text-xs text-muted-foreground">{SCOPE_LABELS[row.activityType]}</span>
                        </div>
                      </td>
                      <td className="py-1.5 pr-3">{row.description}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums font-medium">
                        {fmt(Number(row.amount))} {row.unit}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground text-xs">
                        {row.emissionFactor
                          ? `${row.emissionFactor.value} ${row.emissionFactor.unit}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
