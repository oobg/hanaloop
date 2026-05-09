import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/shared/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const productId = searchParams.get("productId");

  const where = productId ? { productId } : {};

  const results = await prisma.pcfResult.findMany({
    where,
    include: { product: true },
    orderBy: { calculatedAt: "desc" },
    take: 50,
  });

  const data = results.map((r) => ({
    ...r,
    totalEmission: Number(r.totalEmission),
    byScope: JSON.parse(r.byScope) as Record<string, number>,
    byCategory: JSON.parse(r.byCategory) as Record<string, number>,
  }));

  return NextResponse.json({ ok: true, data });
}
