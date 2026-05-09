import { NextRequest, NextResponse } from "next/server";

import { activityDataInputSchema } from "@/entities/activity-data";
import { mapActivityDataToEmissionFactor } from "@/entities/emission-factor";
import { prisma } from "@/shared/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const productId = searchParams.get("productId");
  const month = searchParams.get("month"); // "2025-01"

  const where: Record<string, unknown> = {};
  if (productId) where.productId = productId;
  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.date = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    };
  }

  const rows = await prisma.activityData.findMany({
    where,
    include: { product: true, emissionFactor: true },
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { message: "Invalid JSON" } }, { status: 400 });
  }

  const parsed = activityDataInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      { ok: false, error: { message: "입력값을 확인해 주세요.", fieldErrors, formErrors: [] } },
      { status: 422 },
    );
  }

  const { productId, date, activityType, description, amount, unit } = parsed.data;

  // Validate product exists (accept either cuid or code)
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { code: productId }] },
  });
  if (!product) {
    return NextResponse.json(
      { ok: false, error: { message: "존재하지 않는 제품입니다.", fieldErrors: {}, formErrors: [] } },
      { status: 404 },
    );
  }

  // Auto-map emission factor
  const allFactors = await prisma.emissionFactor.findMany({
    where: { activityType },
    orderBy: { version: "desc" },
  });

  type EFCandidate = Parameters<typeof mapActivityDataToEmissionFactor>[1] extends readonly (infer T)[] ? T : never;
  const mapping = mapActivityDataToEmissionFactor(
    { activityType, description, date },
    allFactors.map((f) => ({
      ...f,
      activityType: f.activityType as "ELECTRICITY" | "RAW_MATERIAL" | "TRANSPORT",
      value: Number(f.value),
    })) as EFCandidate[],
  );

  const record = await prisma.activityData.create({
    data: {
      productId: product.id,
      date: new Date(date),
      activityType,
      description,
      amount,
      unit,
      emissionFactorId: mapping?.factor.id ?? null,
    },
    include: { emissionFactor: true },
  });

  return NextResponse.json({ ok: true, data: record }, { status: 201 });
}
