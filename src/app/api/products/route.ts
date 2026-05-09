import { NextResponse } from "next/server";

import { prisma } from "@/shared/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({ ok: true, data: products });
}
