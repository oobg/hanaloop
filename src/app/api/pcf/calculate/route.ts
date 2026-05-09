import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/shared/lib/prisma";

export const runtime = "nodejs";

const SCOPE_BY_TYPE: Record<string, "SCOPE_2" | "SCOPE_3"> = {
  ELECTRICITY: "SCOPE_2",
  RAW_MATERIAL: "SCOPE_3",
  TRANSPORT: "SCOPE_3",
};

const calculateSchema = z.object({
  productId: z.string().min(1),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = calculateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 });
  }

  const { productId, periodStart, periodEnd } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
  }

  const activities = await prisma.activityData.findMany({
    where: {
      productId,
      date: {
        gte: new Date(periodStart),
        lte: new Date(periodEnd),
      },
    },
    include: { emissionFactor: true },
  });

  let totalEmission = 0;
  const byScope: Record<string, number> = { SCOPE_2: 0, SCOPE_3: 0 };
  const byCategory: Record<string, number> = {
    ELECTRICITY: 0,
    RAW_MATERIAL: 0,
    TRANSPORT: 0,
  };
  const breakdown: Array<{
    id: string;
    date: string;
    activityType: string;
    description: string;
    amount: number;
    unit: string;
    emissionFactorValue: number | null;
    emissionFactorUnit: string | null;
    emission: number;
  }> = [];

  for (const activity of activities) {
    const amount = Number(activity.amount);
    const efValue = activity.emissionFactor ? Number(activity.emissionFactor.value) : null;
    const emission = efValue !== null ? amount * efValue : 0;
    const scope = SCOPE_BY_TYPE[activity.activityType] ?? "SCOPE_3";

    totalEmission += emission;
    byScope[scope] = (byScope[scope] ?? 0) + emission;
    byCategory[activity.activityType] = (byCategory[activity.activityType] ?? 0) + emission;

    breakdown.push({
      id: activity.id,
      date: activity.date.toISOString().slice(0, 10),
      activityType: activity.activityType,
      description: activity.description,
      amount,
      unit: activity.unit,
      emissionFactorValue: efValue,
      emissionFactorUnit: activity.emissionFactor?.unit ?? null,
      emission,
    });
  }

  // Upsert PCF result
  const result = await prisma.pcfResult.upsert({
    where: {
      productId_periodStart_periodEnd: {
        productId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
    },
    update: {
      totalEmission: new Decimal(totalEmission),
      byScope: JSON.stringify(byScope),
      byCategory: JSON.stringify(byCategory),
      calculatedAt: new Date(),
    },
    create: {
      productId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      totalEmission: new Decimal(totalEmission),
      byScope: JSON.stringify(byScope),
      byCategory: JSON.stringify(byCategory),
    },
    include: { product: true },
  });

  return NextResponse.json({
    ok: true,
    data: {
      ...result,
      totalEmission: Number(result.totalEmission),
      byScope: JSON.parse(result.byScope) as Record<string, number>,
      byCategory: JSON.parse(result.byCategory) as Record<string, number>,
      activityCount: activities.length,
      breakdown,
    },
  });
}
