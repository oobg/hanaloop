"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Calculator, RefreshCw } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { DashboardTopBar } from "./dashboard-top-bar";

type Product = { id: string; code: string; name: string };
type PcfResult = {
  id: string;
  productId: string;
  periodStart: string;
  periodEnd: string;
  totalEmission: number;
  byScope: Record<string, number>;
  byCategory: Record<string, number>;
  calculatedAt: string;
  product: Product;
  activityCount?: number;
  breakdown?: Array<{
    date: string;
    activityType: string;
    description: string;
    amount: number;
    unit: string;
    emissionFactorValue: number | null;
    emission: number;
  }>;
};

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRICITY: "전기",
  RAW_MATERIAL: "원소재",
  TRANSPORT: "운송",
};

const SCOPE_COLORS: Record<string, string> = {
  SCOPE_2: "#6366f1",
  SCOPE_3: "#f59e0b",
};

const CATEGORY_COLORS: Record<string, string> = {
  ELECTRICITY: "#6366f1",
  RAW_MATERIAL: "#10b981",
  TRANSPORT: "#f59e0b",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(n);

export function PcfCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [periodStart, setPeriodStart] = useState("2025-01-01");
  const [periodEnd, setPeriodEnd] = useState("2025-08-31");
  const [result, setResult] = useState<PcfResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d: { ok: boolean; data: Product[] }) => {
        if (d.ok) {
          setProducts(d.data);
          setSelectedProductId(d.data[0]?.id ?? "");
        }
      })
      .catch(() => {});
  }, []);

  const calculate = useCallback(async () => {
    if (!selectedProductId) return;
    setCalculating(true);
    setError(null);
    try {
      const res = await fetch("/api/pcf/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId, periodStart, periodEnd }),
      });
      const data = await res.json() as { ok: boolean; data: PcfResult; error?: string };
      if (data.ok) setResult(data.data);
      else setError(String(data.error ?? "계산 오류"));
    } catch {
      setError("네트워크 오류");
    } finally {
      setCalculating(false);
    }
  }, [selectedProductId, periodStart, periodEnd]);

  // Monthly breakdown from result
  const monthlyData = result?.breakdown
    ? Object.entries(
        result.breakdown.reduce<Record<string, Record<string, number>>>((acc, row) => {
          const month = row.date.slice(0, 7);
          if (!acc[month]) acc[month] = { ELECTRICITY: 0, RAW_MATERIAL: 0, TRANSPORT: 0 };
          acc[month]![row.activityType] = (acc[month]![row.activityType] ?? 0) + row.emission;
          return acc;
        }, {}),
      )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, cats]) => ({
          month: month.slice(5) + "월",
          전기: cats["ELECTRICITY"] ?? 0,
          원소재: cats["RAW_MATERIAL"] ?? 0,
          운송: cats["TRANSPORT"] ?? 0,
        }))
    : [];

  const pieData = result
    ? Object.entries(result.byScope).map(([scope, value]) => ({
        name: scope === "SCOPE_2" ? "Scope 2 (전기)" : "Scope 3 (원소재+운송)",
        value: Number(value.toFixed(2)),
        color: SCOPE_COLORS[scope] ?? "#888",
      }))
    : [];

  const categoryData = result
    ? Object.entries(result.byCategory).map(([cat, value]) => ({
        name: CATEGORY_LABELS[cat] ?? cat,
        value: Number(value.toFixed(2)),
        color: CATEGORY_COLORS[cat] ?? "#888",
      }))
    : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <DashboardTopBar
        title="PCF 계산"
        description="제품별 탄소 발자국(kgCO₂e)을 계산하고 GHG Scope 분포를 시각화합니다."
      />

      {/* 계산 컨트롤 */}
      <Card>
        <CardHeader>
          <CardTitle>계산 조건</CardTitle>
          <CardDescription>제품과 기간을 선택하고 계산 버튼을 누르세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">제품</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">시작일</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">종료일</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button onClick={calculate} disabled={calculating || !selectedProductId}>
              {calculating ? (
                <><RefreshCw className="animate-spin size-4 mr-2" />계산 중</>
              ) : (
                <><Calculator className="size-4 mr-2" />PCF 계산</>
              )}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard
              label="총 탄소 발자국"
              value={`${fmt(result.totalEmission)} kgCO₂e`}
              badge="PCF"
            />
            <SummaryCard
              label="Scope 2 (전기)"
              value={`${fmt(result.byScope["SCOPE_2"] ?? 0)} kgCO₂e`}
              badge="간접"
            />
            <SummaryCard
              label="Scope 3 (공급망)"
              value={`${fmt(result.byScope["SCOPE_3"] ?? 0)} kgCO₂e`}
              badge="간접"
            />
            <SummaryCard
              label="활동 데이터 건수"
              value={`${result.activityCount ?? 0}건`}
              badge="데이터"
            />
          </div>

          {/* 월별 배출량 바차트 */}
          {monthlyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>월별 배출량 (kgCO₂e)</CardTitle>
                <CardDescription>카테고리별 누적 배출량 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="" />
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

          {/* Scope 파이차트 + 카테고리 바차트 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>GHG Scope 분포</CardTitle>
                <CardDescription>Scope 2 vs Scope 3 비중</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                      }
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => [`${fmt(Number(v))} kgCO₂e`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>카테고리별 배출량</CardTitle>
                <CardDescription>전기 / 원소재 / 운송 합계</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} unit="" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={48} />
                    <Tooltip formatter={(v: unknown) => [`${fmt(Number(v))} kgCO₂e`, ""]} />
                    <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 상세 내역 테이블 */}
          {result.breakdown && (
            <Card>
              <CardHeader>
                <CardTitle>계산 상세 내역</CardTitle>
                <CardDescription>배출량 = 활동량 × 배출계수 (kgCO₂e)</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="py-2 pr-3">날짜</th>
                      <th className="py-2 pr-3">유형</th>
                      <th className="py-2 pr-3">설명</th>
                      <th className="py-2 pr-3 text-right">활동량</th>
                      <th className="py-2 pr-3 text-right">배출계수</th>
                      <th className="py-2 text-right">배출량(kgCO₂e)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5 pr-3 tabular-nums">{row.date}</td>
                        <td className="py-1.5 pr-3">
                          <Badge variant="outline">{CATEGORY_LABELS[row.activityType] ?? row.activityType}</Badge>
                        </td>
                        <td className="py-1.5 pr-3">{row.description}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">
                          {fmt(row.amount)} {row.unit}
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">
                          {row.emissionFactorValue != null ? row.emissionFactorValue : "—"}
                        </td>
                        <td className="py-1.5 text-right tabular-nums font-medium">
                          {fmt(row.emission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!result && !calculating && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          <Calculator className="size-10 opacity-30" />
          <p className="text-sm">제품과 기간을 선택하고 PCF 계산 버튼을 누르세요.</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Badge variant="outline">{badge}</Badge>
        </div>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
