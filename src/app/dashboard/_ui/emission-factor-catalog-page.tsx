"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DashboardTopBar } from "./dashboard-top-bar";

type EmissionFactor = {
  id: string;
  factorKey: string;
  version: number;
  activityType: string;
  description: string;
  value: string;
  unit: string;
  scope: string;
  validFrom: string;
  validTo: string | null;
};

const ACTIVITY_LABELS: Record<string, string> = {
  ELECTRICITY: "전기",
  RAW_MATERIAL: "원소재",
  TRANSPORT: "운송",
};

const SCOPE_LABELS: Record<string, string> = {
  SCOPE_2: "Scope 2",
  SCOPE_3: "Scope 3",
};

export function EmissionFactorCatalogPage() {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    activityType: "ELECTRICITY",
    description: "",
    value: "",
    unit: "kgCO2e/kWh",
    scope: "SCOPE_2",
    validFrom: "2025-01-01",
    validTo: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const unitByType: Record<string, string> = {
    ELECTRICITY: "kgCO2e/kWh",
    RAW_MATERIAL: "kgCO2e/kg",
    TRANSPORT: "kgCO2e/ton-km",
  };
  const scopeByType: Record<string, string> = {
    ELECTRICITY: "SCOPE_2",
    RAW_MATERIAL: "SCOPE_3",
    TRANSPORT: "SCOPE_3",
  };

  const factorKey = `EF_${form.activityType}_${form.description.toUpperCase().replace(/\s+/g, "_")}`;

  const refresh = useCallback(() => {
    setLoading(true);
    fetch(`/api/emission-factors${activeOnly ? "?activeOnly=true" : ""}`)
      .then((r) => r.json())
      .then((d: { ok: boolean; data: EmissionFactor[] }) => {
        if (d.ok) setFactors(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeOnly]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleActivityTypeChange = (type: string) => {
    setForm((f) => ({
      ...f,
      activityType: type,
      unit: unitByType[type] ?? f.unit,
      scope: scopeByType[type] ?? f.scope,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/emission-factors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factorKey,
          activityType: form.activityType,
          description: form.description,
          value: Number(form.value),
          unit: form.unit,
          scope: form.scope,
          validFrom: form.validFrom,
          validTo: form.validTo || null,
        }),
      });
      const data = await res.json() as { ok: boolean; error?: unknown };
      if (data.ok) {
        setShowForm(false);
        setForm({ activityType: "ELECTRICITY", description: "", value: "", unit: "kgCO2e/kWh", scope: "SCOPE_2", validFrom: "2025-01-01", validTo: "" });
        refresh();
      } else {
        setFormError("저장 실패: 입력값을 확인하세요.");
      }
    } catch {
      setFormError("네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <DashboardTopBar
        title="배출계수"
        description="활동 유형별 GHG 배출계수를 관리합니다. validFrom/validTo 필드로 버전 이력을 추적합니다."
      />

      <div className="flex gap-2 flex-wrap items-center">
        <Button size="sm" variant="outline" onClick={() => { setActiveOnly(!activeOnly); }}>
          {activeOnly ? "전체 이력 보기" : "현재 유효 필터"}
        </Button>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4 mr-1" />배출계수 추가
        </Button>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 배출계수 등록</CardTitle>
            <CardDescription>factorKey: <code className="text-xs">{factorKey}</code></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">활동 유형</label>
                <select value={form.activityType} onChange={(e) => handleActivityTypeChange(e.target.value)} className={inputCls}>
                  <option value="ELECTRICITY">전기</option>
                  <option value="RAW_MATERIAL">원소재</option>
                  <option value="TRANSPORT">운송</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">설명</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="예: 한국전력 기본값" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">계수 값</label>
                <input type="number" step="0.0001" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="0.456" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">단위</label>
                <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className={inputCls}>
                  <option value="kgCO2e/kWh">kgCO₂e/kWh</option>
                  <option value="kgCO2e/kg">kgCO₂e/kg</option>
                  <option value="kgCO2e/ton-km">kgCO₂e/ton-km</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">유효 시작일</label>
                <input type="date" value={form.validFrom} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">유효 종료일 (선택)</label>
                <input type="date" value={form.validTo} onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))} className={inputCls} />
              </div>
            </div>
            {formError && <p className="mt-3 text-sm text-destructive">{formError}</p>}
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>배출계수 목록</CardTitle>
          <CardDescription>
            {activeOnly ? "현재 유효한 배출계수" : "전체 버전 이력"} — {factors.length}건
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">불러오는 중...</p>
          ) : factors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">배출계수가 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="py-2 pr-3">유형</th>
                  <th className="py-2 pr-3">설명</th>
                  <th className="py-2 pr-3 text-right">계수값</th>
                  <th className="py-2 pr-3">단위</th>
                  <th className="py-2 pr-3">Scope</th>
                  <th className="py-2 pr-3">유효 시작</th>
                  <th className="py-2">유효 종료</th>
                </tr>
              </thead>
              <tbody>
                {factors.map((f) => {
                  const isActive = !f.validTo || new Date(f.validTo) >= new Date();
                  return (
                    <tr key={f.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-1.5 pr-3">
                        <Badge variant="outline">{ACTIVITY_LABELS[f.activityType] ?? f.activityType}</Badge>
                      </td>
                      <td className="py-1.5 pr-3">{f.description}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums font-medium">{f.value}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground text-xs">{f.unit}</td>
                      <td className="py-1.5 pr-3">
                        <Badge variant={f.scope === "SCOPE_2" ? "default" : "outline"}>
                          {SCOPE_LABELS[f.scope] ?? f.scope}
                        </Badge>
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums text-muted-foreground text-xs">
                        {f.validFrom.slice(0, 10)}
                      </td>
                      <td className="py-1.5 text-xs">
                        {f.validTo ? (
                          <span className="text-muted-foreground">{f.validTo.slice(0, 10)}</span>
                        ) : (
                          <Badge variant="default" className="text-xs">유효</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
