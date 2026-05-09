import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  invalidJsonResponse,
  validationErrorResponse,
} from "@/app/api/activity-data/validation-response";
import { activityDataInputSchema } from "@/entities/activity-data";
import { mapActivityDataToEmissionFactor } from "@/entities/emission-factor";

export const runtime = "nodejs";

const activityDataIdSchema = z.string().trim().min(1, "활동 데이터 ID는 필수입니다.");

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsedId = activityDataIdSchema.safeParse(id);

  if (!parsedId.success) {
    return validationErrorResponse(parsedId.error);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidJsonResponse();
  }

  const parsed = activityDataInputSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const emissionFactorMapping = mapActivityDataToEmissionFactor(parsed.data);

  return NextResponse.json({
    ok: true,
    data: {
      id: parsedId.data,
      ...parsed.data,
      emissionFactorId: emissionFactorMapping?.factor.id ?? null,
      emissionFactorMapping,
    },
  });
}
