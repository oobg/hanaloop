const WORKBOOK_XML_PATH = "xl/workbook.xml";
const WORKBOOK_RELS_XML_PATH = "xl/_rels/workbook.xml.rels";
const SHARED_STRINGS_XML_PATH = "xl/sharedStrings.xml";

const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;

const ZIP_COMPRESSION_STORED = 0;
const ZIP_COMPRESSION_DEFLATE = 8;

const textDecoder = new TextDecoder("utf-8");

export const EXPECTED_ACTIVITY_TEMPLATE_SHEETS = [
  "과제 개요",
  "과제용 데이터",
  "지원자 체크리스트",
] as const;

export const EXPECTED_ACTIVITY_TEMPLATE_HEADERS = {
  "과제 개요": [["기준", "핵심 질문", "배점", "점수"]],
  "과제용 데이터": [
    ["일자(원본)", "활동 유형", "설명", "량", "단위"],
    ["항목", "계수", "단위"],
  ],
  "지원자 체크리스트": [["구분", "체크 항목", "비고"]],
} as const satisfies Record<
  (typeof EXPECTED_ACTIVITY_TEMPLATE_SHEETS)[number],
  readonly (readonly string[])[]
>;

export type WorkbookSheetMatchResult = {
  ok: boolean;
  expectedSheetNames: readonly string[];
  actualSheetNames: string[];
  matchedSheetNames: string[];
  missingSheetNames: string[];
  unexpectedSheetNames: string[];
  orderMatches: boolean;
};

export type WorksheetRow = {
  rowNumber: number;
  values: string[];
};

export type HeaderGroupValidationResult = {
  expectedHeaders: readonly string[];
  detectedRowNumber: number | null;
  detectedHeaders: string[];
  missingHeaders: string[];
  orderMismatches: HeaderOrderMismatch[];
};

export type HeaderOrderMismatch = {
  expectedHeader: string;
  expectedIndex: number;
  actualIndex: number;
  actualHeaderAtExpectedIndex: string | null;
};

export type WorksheetHeaderValidationResult = {
  ok: boolean;
  sheetName: string;
  headerGroups: HeaderGroupValidationResult[];
};

export type WorkbookHeaderValidationResult = {
  ok: boolean;
  sheets: WorksheetHeaderValidationResult[];
  invalidSheets: WorksheetHeaderValidationResult[];
};

type ZipEntry = {
  compressedSize: number;
  compressionMethod: number;
  localHeaderOffset: number;
  path: string;
};

export async function extractXlsxSheetNames(
  file: File,
): Promise<string[]> {
  const workbookXml = await extractXlsxTextEntry(
    await file.arrayBuffer(),
    WORKBOOK_XML_PATH,
  );

  return extractSheetNamesFromWorkbookXml(workbookXml);
}

export async function getActivityTemplateSheetMatch(
  file: File,
): Promise<WorkbookSheetMatchResult> {
  return matchWorkbookSheetNames(await extractXlsxSheetNames(file));
}

export async function getActivityTemplateHeaderValidation(
  file: File,
): Promise<WorkbookHeaderValidationResult> {
  const xlsxBuffer = await file.arrayBuffer();
  const [workbookXml, workbookRelsXml, sharedStringsXml] = await Promise.all([
    extractXlsxTextEntry(xlsxBuffer, WORKBOOK_XML_PATH),
    extractXlsxTextEntry(xlsxBuffer, WORKBOOK_RELS_XML_PATH),
    extractXlsxTextEntry(xlsxBuffer, SHARED_STRINGS_XML_PATH),
  ]);
  const workbookSheets = extractWorkbookSheetsFromXml(workbookXml);
  const worksheetPathsByRelationshipId =
    extractWorksheetPathsByRelationshipId(workbookRelsXml);
  const sharedStrings = extractSharedStringsFromXml(sharedStringsXml);
  const sheetResults: WorksheetHeaderValidationResult[] = [];

  for (const sheetName of EXPECTED_ACTIVITY_TEMPLATE_SHEETS) {
    const workbookSheet = workbookSheets.find(
      (sheet) => normalizeSheetName(sheet.name) === normalizeSheetName(sheetName),
    );
    const worksheetPath = workbookSheet
      ? worksheetPathsByRelationshipId.get(workbookSheet.relationshipId)
      : null;

    if (!worksheetPath) {
      sheetResults.push({
        ok: false,
        sheetName,
        headerGroups: EXPECTED_ACTIVITY_TEMPLATE_HEADERS[sheetName].map(
          (expectedHeaders) => ({
            expectedHeaders,
            detectedRowNumber: null,
            detectedHeaders: [],
            missingHeaders: [...expectedHeaders],
            orderMismatches: [],
          }),
        ),
      });

      continue;
    }

    const worksheetXml = await extractXlsxTextEntry(xlsxBuffer, worksheetPath);
    const rows = extractWorksheetRowsFromXml(worksheetXml, sharedStrings);

    sheetResults.push(
      validateWorksheetHeaders(
        sheetName,
        rows,
        EXPECTED_ACTIVITY_TEMPLATE_HEADERS[sheetName],
      ),
    );
  }

  const invalidSheets = sheetResults.filter((sheet) => !sheet.ok);

  return {
    ok: invalidSheets.length === 0,
    sheets: sheetResults,
    invalidSheets,
  };
}

export function matchWorkbookSheetNames(
  actualSheetNames: readonly string[],
  expectedSheetNames: readonly string[] = EXPECTED_ACTIVITY_TEMPLATE_SHEETS,
): WorkbookSheetMatchResult {
  const normalizedActualSheetNames = actualSheetNames.map(normalizeSheetName);
  const normalizedExpectedSheetNames = expectedSheetNames.map(normalizeSheetName);
  const actualSheetNameSet = new Set(normalizedActualSheetNames);
  const expectedSheetNameSet = new Set(normalizedExpectedSheetNames);

  const missingSheetNames = expectedSheetNames.filter(
    (_, index) => !actualSheetNameSet.has(normalizedExpectedSheetNames[index]),
  );
  const unexpectedSheetNames = actualSheetNames.filter(
    (_, index) => !expectedSheetNameSet.has(normalizedActualSheetNames[index]),
  );
  const matchedSheetNames = expectedSheetNames.filter(
    (_, index) => actualSheetNameSet.has(normalizedExpectedSheetNames[index]),
  );
  const orderMatches =
    actualSheetNames.length >= expectedSheetNames.length &&
    normalizedExpectedSheetNames.every(
      (sheetName, index) => normalizedActualSheetNames[index] === sheetName,
    );

  return {
    ok: missingSheetNames.length === 0 && unexpectedSheetNames.length === 0,
    expectedSheetNames,
    actualSheetNames: [...actualSheetNames],
    matchedSheetNames,
    missingSheetNames,
    unexpectedSheetNames,
    orderMatches,
  };
}

export function extractSheetNamesFromWorkbookXml(workbookXml: string): string[] {
  return extractWorkbookSheetsFromXml(workbookXml).map((sheet) => sheet.name);
}

export function extractWorkbookSheetsFromXml(workbookXml: string) {
  return Array.from(workbookXml.matchAll(/<sheet\b([^>]*)\/?>/g))
    .map((match) => ({
      name: decodeXmlText(extractXmlAttribute(match[1], "name") ?? "").trim(),
      relationshipId: extractXmlAttribute(match[1], "r:id") ?? "",
    }))
    .filter((sheet) => sheet.name && sheet.relationshipId);
}

export function extractWorksheetRowsFromXml(
  worksheetXml: string,
  sharedStrings: readonly string[] = [],
): WorksheetRow[] {
  return Array.from(worksheetXml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g))
    .map((rowMatch) => {
      const rowNumber = Number(extractXmlAttribute(rowMatch[1], "r"));
      const values = Array.from(
        rowMatch[2].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g),
      )
        .map((cellMatch) =>
          extractWorksheetCellValue(cellMatch[1], cellMatch[2], sharedStrings),
        )
        .filter((value) => value.length > 0);

      return {
        rowNumber: Number.isFinite(rowNumber) ? rowNumber : 0,
        values,
      };
    })
    .filter((row) => row.rowNumber > 0 && row.values.length > 0);
}

export function extractSharedStringsFromXml(sharedStringsXml: string) {
  return Array.from(sharedStringsXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)).map(
    (match) =>
      Array.from(match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))
        .map((textMatch) => decodeXmlText(textMatch[1]))
        .join("")
        .trim(),
  );
}

export function validateWorksheetHeaders(
  sheetName: string,
  rows: readonly WorksheetRow[],
  expectedHeaderGroups: readonly (readonly string[])[],
): WorksheetHeaderValidationResult {
  const headerGroups = expectedHeaderGroups.map((expectedHeaders) =>
    detectHeaderGroup(rows, expectedHeaders),
  );

  return {
    ok: headerGroups.every(
      (headerGroup) =>
        headerGroup.missingHeaders.length === 0 &&
        headerGroup.orderMismatches.length === 0,
    ),
    sheetName,
    headerGroups,
  };
}

async function extractXlsxTextEntry(
  xlsxBuffer: ArrayBuffer,
  entryPath: string,
): Promise<string> {
  const zipData = new Uint8Array(xlsxBuffer);
  const entry = findZipEntry(zipData, entryPath);

  if (!entry) {
    throw new Error(`${entryPath} 파일을 찾을 수 없습니다.`);
  }

  const compressedEntry = readZipEntryBytes(zipData, entry);
  const entryBytes = await decompressZipEntry(entry, compressedEntry);

  return textDecoder.decode(entryBytes);
}

function findZipEntry(zipData: Uint8Array, entryPath: string) {
  const dataView = new DataView(
    zipData.buffer,
    zipData.byteOffset,
    zipData.byteLength,
  );
  const endOfCentralDirectoryOffset = findEndOfCentralDirectory(dataView);
  const centralDirectoryOffset = dataView.getUint32(
    endOfCentralDirectoryOffset + 16,
    true,
  );
  const centralDirectoryEntryCount = dataView.getUint16(
    endOfCentralDirectoryOffset + 10,
    true,
  );

  let cursor = centralDirectoryOffset;

  for (let index = 0; index < centralDirectoryEntryCount; index += 1) {
    const signature = dataView.getUint32(cursor, true);

    if (signature !== ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE) {
      throw new Error("ZIP 중앙 디렉터리 구조가 올바르지 않습니다.");
    }

    const compressionMethod = dataView.getUint16(cursor + 10, true);
    const compressedSize = dataView.getUint32(cursor + 20, true);
    const fileNameLength = dataView.getUint16(cursor + 28, true);
    const extraFieldLength = dataView.getUint16(cursor + 30, true);
    const fileCommentLength = dataView.getUint16(cursor + 32, true);
    const localHeaderOffset = dataView.getUint32(cursor + 42, true);
    const path = textDecoder.decode(
      zipData.subarray(cursor + 46, cursor + 46 + fileNameLength),
    );

    if (path === entryPath) {
      return {
        compressedSize,
        compressionMethod,
        localHeaderOffset,
        path,
      } satisfies ZipEntry;
    }

    cursor += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return null;
}

function findEndOfCentralDirectory(dataView: DataView) {
  const minOffset = Math.max(0, dataView.byteLength - 0xffff - 22);

  for (let offset = dataView.byteLength - 22; offset >= minOffset; offset -= 1) {
    if (
      dataView.getUint32(offset, true) ===
      ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE
    ) {
      return offset;
    }
  }

  throw new Error("ZIP 중앙 디렉터리 끝 레코드를 찾을 수 없습니다.");
}

function readZipEntryBytes(zipData: Uint8Array, entry: ZipEntry) {
  const dataView = new DataView(
    zipData.buffer,
    zipData.byteOffset,
    zipData.byteLength,
  );
  const localHeaderOffset = entry.localHeaderOffset;
  const signature = dataView.getUint32(localHeaderOffset, true);

  if (signature !== ZIP_LOCAL_FILE_HEADER_SIGNATURE) {
    throw new Error(`${entry.path} 로컬 파일 헤더가 올바르지 않습니다.`);
  }

  const fileNameLength = dataView.getUint16(localHeaderOffset + 26, true);
  const extraFieldLength = dataView.getUint16(localHeaderOffset + 28, true);
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraFieldLength;

  return zipData.subarray(dataStart, dataStart + entry.compressedSize);
}

async function decompressZipEntry(entry: ZipEntry, compressedEntry: Uint8Array) {
  if (entry.compressionMethod === ZIP_COMPRESSION_STORED) {
    return compressedEntry;
  }

  if (entry.compressionMethod !== ZIP_COMPRESSION_DEFLATE) {
    throw new Error(
      `${entry.path} 압축 방식(${entry.compressionMethod})을 지원하지 않습니다.`,
    );
  }

  if (typeof DecompressionStream === "undefined") {
    throw new Error("현재 브라우저에서 Excel 압축 해제를 지원하지 않습니다.");
  }

  const compressedBuffer = new ArrayBuffer(compressedEntry.byteLength);
  new Uint8Array(compressedBuffer).set(compressedEntry);

  const stream = new Blob([compressedBuffer]).stream();
  const decompressedStream = stream.pipeThrough(
    new DecompressionStream("deflate-raw"),
  );
  const decompressedBuffer = await new Response(
    decompressedStream,
  ).arrayBuffer();

  return new Uint8Array(decompressedBuffer);
}

function normalizeSheetName(sheetName: string) {
  return sheetName.trim();
}

function extractWorksheetPathsByRelationshipId(workbookRelsXml: string) {
  const relationshipMap = new Map<string, string>();

  for (const match of workbookRelsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const relationshipId = extractXmlAttribute(match[1], "Id");
    const target = extractXmlAttribute(match[1], "Target");

    if (!relationshipId || !target || !target.includes("worksheets/")) {
      continue;
    }

    relationshipMap.set(
      relationshipId,
      target.startsWith("xl/") ? target : `xl/${target.replace(/^\//, "")}`,
    );
  }

  return relationshipMap;
}

function detectHeaderGroup(
  rows: readonly WorksheetRow[],
  expectedHeaders: readonly string[],
): HeaderGroupValidationResult {
  const normalizedExpectedHeaders = expectedHeaders.map(normalizeHeaderValue);
  let bestMatch: HeaderGroupValidationResult | null = null;

  for (const row of rows) {
    const normalizedActualHeaders = row.values.map(normalizeHeaderValue);
    const missingHeaders = expectedHeaders.filter(
      (_, index) => !normalizedActualHeaders.includes(normalizedExpectedHeaders[index]),
    );
    const orderMismatches = findHeaderOrderMismatches(
      expectedHeaders,
      normalizedExpectedHeaders,
      row.values,
      normalizedActualHeaders,
    );

    if (missingHeaders.length === 0 && orderMismatches.length === 0) {
      return {
        expectedHeaders,
        detectedRowNumber: row.rowNumber,
        detectedHeaders: row.values,
        missingHeaders: [],
        orderMismatches: [],
      };
    }

    if (
      !bestMatch ||
      missingHeaders.length < bestMatch.missingHeaders.length ||
      (missingHeaders.length === bestMatch.missingHeaders.length &&
        orderMismatches.length < bestMatch.orderMismatches.length)
    ) {
      bestMatch = {
        expectedHeaders,
        detectedRowNumber: row.rowNumber,
        detectedHeaders: row.values,
        missingHeaders,
        orderMismatches,
      };
    }
  }

  return (
    bestMatch ?? {
      expectedHeaders,
      detectedRowNumber: null,
      detectedHeaders: [],
      missingHeaders: [...expectedHeaders],
      orderMismatches: [],
    }
  );
}

function findHeaderOrderMismatches(
  expectedHeaders: readonly string[],
  normalizedExpectedHeaders: readonly string[],
  actualHeaders: readonly string[],
  normalizedActualHeaders: readonly string[],
) {
  const actualIndexes = normalizedExpectedHeaders.map((expectedHeader) =>
    normalizedActualHeaders.indexOf(expectedHeader),
  );

  if (actualIndexes.some((actualIndex) => actualIndex === -1)) {
    return [];
  }

  const actualStartIndex = Math.min(...actualIndexes);

  return expectedHeaders.flatMap((expectedHeader, expectedIndex) => {
    const expectedActualIndex = actualStartIndex + expectedIndex;
    const actualIndex = actualIndexes[expectedIndex];

    if (actualIndex === expectedActualIndex) {
      return [];
    }

    return {
      expectedHeader,
      expectedIndex,
      actualIndex,
      actualHeaderAtExpectedIndex: actualHeaders[expectedActualIndex] ?? null,
    };
  });
}

function extractWorksheetCellValue(
  attributes: string,
  cellXml: string,
  sharedStrings: readonly string[],
) {
  const cellType = extractXmlAttribute(attributes, "t");

  if (cellType === "inlineStr") {
    return Array.from(cellXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))
      .map((match) => decodeXmlText(match[1]))
      .join("")
      .trim();
  }

  const rawValue = cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1];

  if (!rawValue) {
    return "";
  }

  if (cellType === "s") {
    return sharedStrings[Number(rawValue)]?.trim() ?? "";
  }

  return decodeXmlText(rawValue).trim();
}

function extractXmlAttribute(attributes: string, attributeName: string) {
  const escapedAttributeName = escapeRegExp(attributeName);
  const match = attributes.match(
    new RegExp(`(?:^|\\s)${escapedAttributeName}="([^"]*)"`, "u"),
  );

  return match?.[1] ?? null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeHeaderValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeXmlText(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
