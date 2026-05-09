import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { prisma } from "@/shared/lib/prisma";

export const runtime = "nodejs";

const ACTIVITY_TYPE_MAP: Record<string, string> = {
  전기: "ELECTRICITY",
  원소재: "RAW_MATERIAL",
  운송: "TRANSPORT",
};

const EMISSION_FACTOR_KEY_MAP: Record<string, Record<string, string>> = {
  ELECTRICITY: { 한국전력: "EF_ELECTRICITY_KR" },
  RAW_MATERIAL: { "플라스틱 1": "EF_RAW_PLASTIC1", "플라스틱 2": "EF_RAW_PLASTIC2" },
  TRANSPORT: { 트럭: "EF_TRANSPORT_TRUCK" },
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const productCode = (formData.get("productCode") as string) ?? "CT-045";

  if (!file) {
    return NextResponse.json({ ok: false, error: "파일이 없습니다." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { code: productCode } });
  if (!product) {
    return NextResponse.json({ ok: false, error: "제품을 찾을 수 없습니다." }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const sheetName = "과제용 데이터";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return NextResponse.json(
      { ok: false, error: `'${sheetName}' 시트를 찾을 수 없습니다.` },
      { status: 422 },
    );
  }

  // 헤더 행 위치를 동적으로 탐색 (시트 상단에 제목/설명 행이 있을 수 있음)
  const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  const headerRowIndex = rawMatrix.findIndex(
    (r) => Array.isArray(r) && r.some((cell) => String(cell ?? "").includes("일자")),
  );
  if (headerRowIndex === -1) {
    return NextResponse.json(
      { ok: false, error: "헤더 행('일자(원본)' 컬럼)을 찾을 수 없습니다." },
      { status: 422 },
    );
  }
  const headers = rawMatrix[headerRowIndex] as (string | null)[];
  const dataMatrix = rawMatrix.slice(headerRowIndex + 1);
  const rows: Record<string, unknown>[] = dataMatrix.map((r) => {
    const arr = r as unknown[];
    return Object.fromEntries(headers.map((h, i) => [String(h ?? i), arr[i] ?? null]));
  });

  const emissionFactors = await prisma.emissionFactor.findMany();
  const efByKey = Object.fromEntries(emissionFactors.map((f) => [f.factorKey, f]));

  const created: string[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    // 헤더 행 스킵 (null 값만 있거나 비어있으면)
    const rawDate = row["일자(원본)"] ?? row["일자"];
    const rawType = row["활동 유형"];
    const rawDesc = row["설명"];
    const rawAmount = row["량"];
    const rawUnit = row["단위"];

    if (!rawDate || !rawType) continue;

    const activityType = ACTIVITY_TYPE_MAP[String(rawType)];
    if (!activityType) {
      errors.push({ row: i + 2, message: `알 수 없는 활동 유형: ${String(rawType)}` });
      continue;
    }

    const amount = Number(rawAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      errors.push({ row: i + 2, message: `활동량이 유효하지 않습니다: ${String(rawAmount)}` });
      continue;
    }

    let date: Date;
    try {
      date = typeof rawDate === "number"
        ? new Date(Math.round((rawDate - 25569) * 86400 * 1000)) // Excel serial date
        : new Date(String(rawDate));
    } catch {
      errors.push({ row: i + 2, message: `날짜 형식 오류: ${String(rawDate)}` });
      continue;
    }

    const description = String(rawDesc ?? "");
    const efKeys = EMISSION_FACTOR_KEY_MAP[activityType] ?? {};
    const efKey = efKeys[description];
    const ef = efKey ? efByKey[efKey] : null;

    await prisma.activityData.create({
      data: {
        productId: product.id,
        date,
        activityType,
        description,
        amount,
        unit: String(rawUnit ?? ""),
        emissionFactorId: ef?.id ?? null,
      },
    });

    created.push(`${String(rawDate)} ${activityType} ${description} ${amount}`);
  }

  return NextResponse.json({
    ok: true,
    data: { created: created.length, errors },
  });
}
