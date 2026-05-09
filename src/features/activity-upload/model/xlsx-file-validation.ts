import {
  getActivityTemplateHeaderValidation,
  getActivityTemplateSheetMatch,
} from "./xlsx-workbook-sheets";

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const MAX_XLSX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const xlsxZipSignatures = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
] as const;

export type XlsxFileValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export async function validateXlsxFile(
  file: File,
): Promise<XlsxFileValidationResult> {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return {
      ok: false,
      message: "Excel .xlsx 확장자 파일만 업로드할 수 있습니다.",
    };
  }

  if (file.type && file.type !== XLSX_MIME_TYPE) {
    return {
      ok: false,
      message: "파일 MIME 유형이 .xlsx 형식과 일치하지 않습니다.",
    };
  }

  if (file.size === 0) {
    return {
      ok: false,
      message: "비어 있는 파일은 업로드할 수 없습니다.",
    };
  }

  if (file.size > MAX_XLSX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      message: "10MB 이하의 .xlsx 파일만 업로드할 수 있습니다.",
    };
  }

  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());

  if (!hasXlsxZipSignature(header)) {
    return {
      ok: false,
      message: "파일 내용이 유효한 .xlsx 형식이 아닙니다.",
    };
  }

  const sheetMatch = await getActivityTemplateSheetMatch(file).catch(() => null);

  if (!sheetMatch) {
    return {
      ok: false,
      message: "Excel 통합 문서의 시트 정보를 읽을 수 없습니다.",
    };
  }

  if (!sheetMatch.ok) {
    return {
      ok: false,
      message: formatSheetMismatchMessage(sheetMatch),
    };
  }

  const headerValidation = await getActivityTemplateHeaderValidation(file).catch(
    () => null,
  );

  if (!headerValidation) {
    return {
      ok: false,
      message: "Excel 통합 문서의 헤더 행을 읽을 수 없습니다.",
    };
  }

  if (!headerValidation.ok) {
    return {
      ok: false,
      message: formatHeaderMismatchMessage(headerValidation),
    };
  }

  return { ok: true };
}

function hasXlsxZipSignature(header: Uint8Array) {
  return xlsxZipSignatures.some((signature) =>
    signature.every((byte, index) => header[index] === byte),
  );
}

function formatSheetMismatchMessage(
  sheetMatch: NonNullable<
    Awaited<ReturnType<typeof getActivityTemplateSheetMatch>>
  >,
) {
  const details = [
    sheetMatch.missingSheetNames.length > 0
      ? `누락 시트: ${sheetMatch.missingSheetNames.join(", ")}`
      : null,
    sheetMatch.unexpectedSheetNames.length > 0
      ? `예상 밖 시트: ${sheetMatch.unexpectedSheetNames.join(", ")}`
      : null,
  ].filter(Boolean);

  return `제공된 Excel 양식의 시트 목록과 일치하지 않습니다. ${details.join(" / ")}`;
}

function formatHeaderMismatchMessage(
  headerValidation: NonNullable<
    Awaited<ReturnType<typeof getActivityTemplateHeaderValidation>>
  >,
) {
  const details = headerValidation.invalidSheets.flatMap((sheet) =>
    sheet.headerGroups
      .filter(
        (headerGroup) =>
          headerGroup.missingHeaders.length > 0 ||
          headerGroup.orderMismatches.length > 0,
      )
      .map((headerGroup) => {
        const missingHeaders =
          headerGroup.missingHeaders.length > 0
            ? `누락 헤더: ${headerGroup.missingHeaders.join(", ")}`
            : null;
        const orderMismatches =
          headerGroup.orderMismatches.length > 0
            ? `순서 불일치: ${headerGroup.orderMismatches
                .map(
                  (mismatch) =>
                    `${mismatch.expectedHeader}(${mismatch.actualIndex + 1}열→${mismatch.expectedIndex + 1}열)`,
                )
                .join(", ")}`
            : null;

        return `${sheet.sheetName}: ${[missingHeaders, orderMismatches].filter(Boolean).join(" / ")}`;
      }),
  );

  return `제공된 Excel 양식의 헤더가 기대 스키마와 일치하지 않습니다. ${details.join(" / ")}`;
}
