"use client";

import { RotateCcw, Save } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";

import {
  type ActivityType,
  type ActivityUnit,
  CT045_PRODUCT_CODE,
  CT045_PRODUCT_NAME,
} from "@/entities/activity-data";
import {
  type ActivityDataMutationField,
  type ActivityDataMutationFieldErrors,
  type ActivityDataMutationResponse,
  clearActivityDataMutationFieldErrors,
  toActivityDataMutationFieldErrors,
} from "@/features/activity-manual-entry/model/activity-data-api";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

type ActivityDataFormState = {
  productId: string;
  date: string;
  activityType: ActivityType;
  description: string;
  amount: string;
  unit: ActivityUnit;
};

const products = [
  { id: "ct-045", code: CT045_PRODUCT_CODE, name: CT045_PRODUCT_NAME },
  { id: "pkg-a01", code: "PKG-A01", name: "재활용 포장재 A" },
] as const;

const activityOptions: Array<{
  value: ActivityType;
  label: string;
  scope: string;
  defaultUnit: ActivityUnit;
  placeholder: string;
}> = [
  {
    value: "ELECTRICITY",
    label: "전력 사용",
    scope: "Scope 2",
    defaultUnit: "kWh",
    placeholder: "예: 조립 라인 전력 사용량",
  },
  {
    value: "RAW_MATERIAL",
    label: "원소재 투입",
    scope: "Scope 3",
    defaultUnit: "kg",
    placeholder: "예: LCD 패널 원재료 투입량",
  },
  {
    value: "TRANSPORT",
    label: "운송",
    scope: "Scope 3",
    defaultUnit: "ton-km",
    placeholder: "예: 부품 입고 운송 거리",
  },
];

const unitOptions: ActivityUnit[] = ["kWh", "kg", "ton-km"];

const initialFormState: ActivityDataFormState = {
  productId: "ct-045",
  date: "2026-05-09",
  activityType: "ELECTRICITY",
  description: "",
  amount: "",
  unit: "kWh",
};

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/40";

const textareaClassName =
  "min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/40";

function formatAmount(amount: string, unit: string) {
  if (!amount) {
    return "미입력";
  }

  const parsed = Number(amount);
  if (Number.isNaN(parsed)) {
    return `${amount} ${unit}`;
  }

  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 3,
  }).format(parsed)} ${unit}`;
}

export function ActivityDataManualForm() {
  const [form, setForm] = useState<ActivityDataFormState>(initialFormState);
  const [fieldErrors, setFieldErrors] =
    useState<ActivityDataMutationFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const selectedActivity = useMemo(
    () =>
      activityOptions.find((option) => option.value === form.activityType) ??
      activityOptions[0],
    [form.activityType],
  );

  const selectedProduct = useMemo(
    () =>
      products.find((product) => product.id === form.productId) ?? products[0],
    [form.productId],
  );

  const getErrorId = (fieldId: string, error?: string) =>
    error ? `${fieldId}-error` : undefined;

  function updateForm<Key extends keyof ActivityDataFormState>(
    key: Key,
    value: ActivityDataFormState[Key],
  ) {
    setStatus("idle");
    setFormError(null);
    setFieldErrors((current) =>
      clearActivityDataMutationFieldErrors(current, [
        key as ActivityDataMutationField,
      ]),
    );
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleActivityTypeChange(value: ActivityType) {
    const nextActivity = activityOptions.find(
      (option) => option.value === value,
    );

    setStatus("idle");
    setFormError(null);
    setFieldErrors((current) =>
      clearActivityDataMutationFieldErrors(current, ["activityType", "unit"]),
    );
    setForm((current) => ({
      ...current,
      activityType: value,
      unit: nextActivity?.defaultUnit ?? current.unit,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/activity-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as ActivityDataMutationResponse;

      if (!response.ok || !result.ok) {
        const error = result.ok
          ? {
              message: "활동 데이터를 저장할 수 없습니다.",
              fieldErrors: {},
              formErrors: [],
            }
          : result.error;

        setFieldErrors(toActivityDataMutationFieldErrors(error.fieldErrors));
        setFormError(error.formErrors[0] ?? error.message);
        setStatus("error");
        return;
      }

      setStatus("saved");
    } catch {
      setFormError("네트워크 오류로 활동 데이터를 저장할 수 없습니다.");
      setStatus("error");
    }
  }

  function handleReset() {
    setForm(initialFormState);
    setFieldErrors({});
    setFormError(null);
    setStatus("idle");
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>활동 데이터 수동 입력</CardTitle>
            <CardDescription>
              제품별 활동량을 입력하고 배출계수 연결 전 검토 가능한 초안으로
              정리합니다.
            </CardDescription>
          </div>
          <Badge variant="outline">서버 계산 전 입력 단계</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="제품"
              htmlFor="activity-product"
              error={fieldErrors.productId?.[0]}
            >
              <select
                id="activity-product"
                value={form.productId}
                onChange={(event) =>
                  updateForm("productId", event.target.value)
                }
                className={inputClassName}
                aria-invalid={Boolean(fieldErrors.productId)}
                aria-describedby={getErrorId(
                  "activity-product",
                  fieldErrors.productId?.[0],
                )}
                required
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.code} · {product.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="활동 일자"
              htmlFor="activity-date"
              error={fieldErrors.date?.[0]}
            >
              <input
                id="activity-date"
                type="date"
                value={form.date}
                onChange={(event) => updateForm("date", event.target.value)}
                className={inputClassName}
                aria-invalid={Boolean(fieldErrors.date)}
                aria-describedby={getErrorId(
                  "activity-date",
                  fieldErrors.date?.[0],
                )}
                required
              />
            </Field>

            <Field
              label="활동 유형"
              htmlFor="activity-type"
              error={fieldErrors.activityType?.[0]}
            >
              <select
                id="activity-type"
                value={form.activityType}
                onChange={(event) =>
                  handleActivityTypeChange(event.target.value as ActivityType)
                }
                className={inputClassName}
                aria-invalid={Boolean(fieldErrors.activityType)}
                aria-describedby={getErrorId(
                  "activity-type",
                  fieldErrors.activityType?.[0],
                )}
                required
              >
                {activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} · {option.scope}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="단위"
              htmlFor="activity-unit"
              error={fieldErrors.unit?.[0]}
            >
              <select
                id="activity-unit"
                value={form.unit}
                onChange={(event) =>
                  updateForm("unit", event.target.value as ActivityUnit)
                }
                className={inputClassName}
                aria-invalid={Boolean(fieldErrors.unit)}
                aria-describedby={getErrorId(
                  "activity-unit",
                  fieldErrors.unit?.[0],
                )}
                required
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="활동량"
              htmlFor="activity-amount"
              error={fieldErrors.amount?.[0]}
            >
              <input
                id="activity-amount"
                type="number"
                min="0"
                step="0.001"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => updateForm("amount", event.target.value)}
                placeholder="0.000"
                className={cn(
                  inputClassName,
                  "tabular-nums placeholder:text-muted-foreground",
                )}
                aria-invalid={Boolean(fieldErrors.amount)}
                aria-describedby={getErrorId(
                  "activity-amount",
                  fieldErrors.amount?.[0],
                )}
                required
              />
            </Field>

            <Field
              label="활동 설명"
              htmlFor="activity-description"
              className="sm:col-span-2"
              error={fieldErrors.description?.[0]}
            >
              <textarea
                id="activity-description"
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder={selectedActivity.placeholder}
                className={textareaClassName}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={getErrorId(
                  "activity-description",
                  fieldErrors.description?.[0],
                )}
                required
              />
            </Field>

            {formError ? (
              <p className="text-destructive sm:col-span-2 text-sm">
                {formError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit" disabled={status === "saving"}>
                <Save aria-hidden="true" />
                {status === "saving" ? "저장 중" : "초안 저장"}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                <RotateCcw aria-hidden="true" />
                초기화
              </Button>
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">입력 검토</h3>
              <Badge variant={status === "saved" ? "accent" : "outline"}>
                {status === "saved"
                  ? "검증 통과"
                  : status === "error"
                    ? "수정 필요"
                    : status === "saving"
                      ? "저장 중"
                      : "작성 중"}
              </Badge>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <PreviewRow label="제품" value={selectedProduct.code} />
              <PreviewRow label="활동 유형" value={selectedActivity.label} />
              <PreviewRow label="GHG Scope" value={selectedActivity.scope} />
              <PreviewRow
                label="활동량"
                value={formatAmount(form.amount, form.unit)}
              />
              <PreviewRow label="활동 일자" value={form.date || "미입력"} />
            </dl>
            <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
              서버 검증을 통과한 입력값은 ActivityData 저장과 PCF 계산 API에서
              배출계수 매칭에 사용됩니다.
            </p>
          </aside>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  className,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-destructive mt-1 text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-44 truncate text-right font-medium">{value}</dd>
    </div>
  );
}
