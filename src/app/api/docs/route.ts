import { NextResponse } from "next/server";

import { openapiSpec } from "@/lib/openapi-spec";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(openapiSpec);
}
