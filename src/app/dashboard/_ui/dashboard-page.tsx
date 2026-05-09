"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Zap, Package, Truck, Database } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { DashboardTopBar } from "./dashboard-top-bar";

type ActivityRow = {
  id: string;
  date: string;
  activityType: string;
  description: string;
  amount: string;
  unit: string;
  emissionFactor: { value: string; unit: string } | null;
  product: { code: string; name: string };
};

type EmissionFactor = {
  id: string;
  activityType: string;
  description: string;
  value: string;
  unit: string;
};

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

const CATEGORY_COLORS: Record<string, string> = {
  ELECTRICITY: "#6366f1",
  RAW_MATERIAL: "#10b981",
  TRANSPORT: "#f59e0b",
};

const EF_MAP: Record<string, number> = {
  ELECTRICITY: 0.456,
  RAW_MATERIAL_1: 2.3,
  RAW_MATERIAL_2: 3.2,
  TRANSPORT: 3.5,
};

function calcEmission(row: ActivityRow): number {
  const ef = row.emissionFactor ? Number(row.emissionFactor.value) : null;
  if (ef === null) return 0;
  return Number(row.amount) * ef;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(n);

export function DashboardPage() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [efCount, setEfCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/activity-data").then((r) => r.json()),
      fetch("/api/emission-factors").then((r) => r.json()),
    ])
      .then(([actData, efData]: [{ ok: boolean; data: ActivityRow[] }, { ok: boolean; data: EmissionFactor[] }]) => {
        if (actData.ok) setActivities(actData.data);
        if (efData.ok) setEfCount(efData.data.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Aggregate
  const totalEmission = activities.reduce((sum, r) => sum + calcEmission(r), 0);
  const scope2 = activities
    .filter((r) => r.activityType === "ELECTRICITY")
    .reduce((sum, r) => sum + calcEmission(r), 0);
  const scope3 = totalEmission - scope2;

  // Monthly chart data
  const monthlyData = Object.entries(
    activities.reduce<Record<string, Record<string, number>>>((acc, row) => {
      const month = row.date.slice(0, 7);
      if (!acc[month]) acc[month] = { ELECTRICITY: 0, RAW_MATERIAL: 0, TRANSPORT: 0 };
      acc[month]![row.activityType] = (acc[month]![row.activityType] ?? 0) + calcEmission(row);
      return acc;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, cats]) => ({
      month: month.slice(5) + "월",
      전기: Number((cats["ELECTRICITY"] ?? 0).toFixed(2)),
      원소재: Number((cats["RAW_MATERIAL"] ?? 0).toFixed(2)),
      운송: Number((cats["TRANSPORT"] ?? 0).toFixed(2)),
    }));

  // Recent activities (top 5)
  const recent = [...activities].slice(0, 5);

  const summaryCards = [
    {
      label: "총 배출량",
      value: `${fmt(totalEmission)} kgCO₂e`,
      sub: "전체 활동 합산",
      icon: <Database className="size-4" />,
    },
    {
      label: "Scope 2 (전기)",
      value: `${fmt(scope2)} kgCO₂e`,
      sub: "간접 배출",
      icon: <Zap className="size-4" />,
    },
    {
      label: "Scope 3 (공급망)",
      value: `${fmt(scope3)} kgCO₂e`,
      sub: "원소재 + 운송",
      icon: <Package className="size-4" />,
    },
    {
      label: "활동 데이터",
      value: `${activities.length}건`,
      sub: `배출계수 ${efCount}종`,
      icon: <Truck className="size-4" />,
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
        <DashboardTopBar title="대시보드" description="PCF 업무 현황을 한눈에 봅니다." />
        <p className="text-muted-foreground text-sm text-center py-12">데이터 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <DashboardTopBar
        title="대시보드"
        description="PCF 업무 현황을 한눈에 봅니다. 활동 데이터 범위, 배출계수 참조, kgCO₂e 단위 배출량을 요약합니다."
      />

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <span className="text-muted-foreground">{card.icon}</span>
              </div>
              <p className="text-lg font-semibold tabular-nums leading-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 월별 배출량 차트 */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>월별 배출량 추이 (kgCO₂e)</CardTitle>
            <CardDescription>카테고리별 누적 배출량 · CT-045 컴퓨터 화면</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: unknown) => [`${fmt(Number(v))} kgCO₂e`, ""]} />
                <Legend />
                <Bar dataKey="전기" stackId="a" fill={CATEGORY_COLORS["ELECTRICITY"]} />
                <Bar dataKey="원소재" stackId="a" fill={CATEGORY_COLORS["RAW_MATERIAL"]} />
                <Bar dataKey="운송" stackId="a" fill={CATEGORY_COLORS["TRANSPORT"]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 최근 활동 데이터 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동 데이터</CardTitle>
          <CardDescription>최근 5건 · 배출량 = 활동량 × 배출계수</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              데이터가 없습니다. 활동 데이터 메뉴에서 입력하거나 시드를 실행하세요.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="py-2 pr-3">날짜</th>
                  <th className="py-2 pr-3">유형</th>
                  <th className="py-2 pr-3">설명</th>
                  <th className="py-2 pr-3 text-right">활동량</th>
                  <th className="py-2 text-right">배출량 (kgCO₂e)</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-1.5 pr-3 tabular-nums text-muted-foreground">
                      {row.date.slice(0, 10)}
                    </td>
                    <td className="py-1.5 pr-3">
                      <Badge variant="outline">
                        {ACTIVITY_LABELS[row.activityType] ?? row.activityType}
                      </Badge>
                    </td>
                    <td className="py-1.5 pr-3">{row.description}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {fmt(Number(row.amount))} {row.unit}
                    </td>
                    <td className="py-1.5 text-right tabular-nums font-medium">
                      {row.emissionFactor ? fmt(calcEmission(row)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
