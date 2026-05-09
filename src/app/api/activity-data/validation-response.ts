import { NextResponse } from "next/server";
import { z } from "zod";

export type ApiFieldErrors = Record<string, string[]>;

export function validationErrorResponse(error: z.ZodError) {
  const flattened = z.flattenError(error);

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "활동 데이터 입력값을 확인해 주세요.",
        fieldErrors: flattened.fieldErrors satisfies ApiFieldErrors,
        formErrors: flattened.formErrors,
      },
    },
    { status: 422 },
  );
}

export function invalidJsonResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "INVALID_JSON",
        message: "요청 본문은 유효한 JSON이어야 합니다.",
        fieldErrors: {},
        formErrors: ["요청 본문을 파싱할 수 없습니다."],
      },
    },
    { status: 400 },
  );
}
