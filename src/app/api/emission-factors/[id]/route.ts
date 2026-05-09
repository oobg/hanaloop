import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/shared/lib/prisma";

export const runtime = "nodejs";

const updateSchema = z.object({
  description: z.string().min(1).max(120).optional(),
  value: z.number().positive().optional(),
  validTo: z.string().date().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.emissionFactor.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.emissionFactor.update({
    where: { id },
    data: {
      ...parsed.data,
      validTo: parsed.data.validTo !== undefined
        ? parsed.data.validTo ? new Date(parsed.data.validTo) : null
        : undefined,
    },
  });

  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.emissionFactor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
