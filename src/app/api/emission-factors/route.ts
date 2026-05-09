import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/shared/lib/prisma";

export const runtime = "nodejs";

const createSchema = z.object({
  factorKey: z.string().min(1),
  activityType: z.enum(["ELECTRICITY", "RAW_MATERIAL", "TRANSPORT"]),
  description: z.string().min(1).max(120),
  value: z.number().positive(),
  unit: z.enum(["kgCO2e/kWh", "kgCO2e/kg", "kgCO2e/ton-km"]),
  scope: z.enum(["SCOPE_2", "SCOPE_3"]),
  validFrom: z.string().date(),
  validTo: z.string().date().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const activeOnly = searchParams.get("activeOnly") === "true";

  const where = activeOnly
    ? {
        OR: [
          { validTo: null },
          { validTo: { gte: new Date() } },
        ],
      }
    : {};

  const factors = await prisma.emissionFactor.findMany({
    where,
    orderBy: [{ activityType: "asc" }, { validFrom: "desc" }],
  });

  return NextResponse.json({ ok: true, data: factors });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { factorKey, validFrom, validTo, ...rest } = parsed.data;

  // Determine next version
  const latest = await prisma.emissionFactor.findFirst({
    where: { factorKey },
    orderBy: { version: "desc" },
  });
  const version = (latest?.version ?? 0) + 1;

  const factor = await prisma.emissionFactor.create({
    data: {
      factorKey,
      version,
      validFrom: new Date(validFrom),
      validTo: validTo ? new Date(validTo) : null,
      ...rest,
    },
  });

  return NextResponse.json({ ok: true, data: factor }, { status: 201 });
}
