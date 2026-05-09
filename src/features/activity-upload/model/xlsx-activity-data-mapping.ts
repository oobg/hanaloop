import {
  type ActivityDataInput,
  activityDataInputSchema,
  activityDataPrismaRequiredFields,
  type ActivityType,
  type ActivityUnit,
  CT045_PRODUCT_CODE,
} from "../../../entities/activity-data";
import {
  EXPECTED_ACTIVITY_TEMPLATE_HEADERS,
  type WorksheetRow,
} from "./xlsx-workbook-sheets";

const ACTIVITY_DATA_HEADER_ROW =
  EXPECTED_ACTIVITY_TEMPLATE_HEADERS["과제용 데이터"][0];

const activityTypeByWorkbookValue: Record<string, ActivityType> = {
  ELECTRICITY: "ELECTRICITY",
  RAW_MATERIAL: "RAW_MATERIAL",
  TRANSPORT: "TRANSPORT",
  전기: "ELECTRICITY",
  원소재: "RAW_MATERIAL",
  운송: "TRANSPORT",
};

const unitByWorkbookValue: Record<string, ActivityUnit> = {
  kwh: "kWh",
  kg: "kg",
  "ton-km": "ton-km",
  tonkm: "ton-km",
  "ton km": "ton-km",
};

const requiredFieldMessages = {
  productId: "제품은 필수입니다.",
  date: "활동 일자는 필수입니다.",
  activityType: "활동 유형은 필수입니다.",
  description: "활동 설명은 필수입니다.",
  amount: "활동량은 필수입니다.",
  unit: "단위는 필수입니다.",
} as const satisfies Record<
  (typeof activityDataPrismaRequiredFields)[number],
  string
>;

export type ActivityDataWorkbookMappingOptions = {
  productId?: string;
  headerRowNumber?: number;
};

export type ActivityDataWorkbookMappingIssue = {
  rowNumber: number;
  field?: keyof ActivityDataInput;
  message: string;
  value?: string;
};

export type ActivityDataWorkbookRowMappingResult =
  | {
      ok: true;
      rowNumber: number;
      input: ActivityDataInput;
    }
  | {
      ok: false;
      rowNumber: number;
      issues: ActivityDataWorkbookMappingIssue[];
    };

export type ActivityDataWorkbookMappingResult = {
  inputs: ActivityDataInput[];
  rowResults: ActivityDataWorkbookRowMappingResult[];
  issues: ActivityDataWorkbookMappingIssue[];
};

export function mapXlsxActivityRowsToActivityDataInputs(
  rows: readonly WorksheetRow[],
  options: ActivityDataWorkbookMappingOptions = {},
): ActivityDataWorkbookMappingResult {
  const headerRowNumber =
    options.headerRowNumber ?? detectActivityDataHeaderRowNumber(rows);
  const dataRows = rows.filter((row) => row.rowNumber > headerRowNumber);
  const rowResults = dataRows
    .filter(hasActivityDataCandidateValues)
    .map((row) => mapXlsxActivityRowToActivityDataInput(row, options));
  const inputs = rowResults.flatMap((result) =>
    result.ok ? [result.input] : [],
  );
  const issues = rowResults.flatMap((result) =>
    result.ok ? [] : result.issues,
  );

  return {
    inputs,
    rowResults,
    issues,
  };
}

export function mapXlsxActivityRowToActivityDataInput(
  row: WorksheetRow,
  options: ActivityDataWorkbookMappingOptions = {},
): ActivityDataWorkbookRowMappingResult {
  const [rawDate, rawActivityType, rawDescription, rawAmount, rawUnit] =
    row.values;
  const candidate = {
    productId: options.productId ?? CT045_PRODUCT_CODE,
    date: normalizeWorkbookDate(rawDate ?? ""),
    activityType: normalizeWorkbookActivityType(rawActivityType ?? ""),
    description: normalizeWorkbookText(rawDescription ?? ""),
    amount: normalizeWorkbookAmount(rawAmount ?? ""),
    unit: normalizeWorkbookUnit(rawUnit ?? ""),
  };
  const requiredIssues = validateMappedActivityDataRequiredFields(
    candidate,
    row.rowNumber,
  );

  if (requiredIssues.length > 0) {
    return {
      ok: false,
      rowNumber: row.rowNumber,
      issues: requiredIssues,
    };
  }

  const parsed = activityDataInputSchema.safeParse(candidate);

  if (parsed.success) {
    return {
      ok: true,
      rowNumber: row.rowNumber,
      input: parsed.data,
    };
  }

  return {
    ok: false,
    rowNumber: row.rowNumber,
    issues: parsed.error.issues.map((issue) => {
      const field = issue.path[0];

      return {
        rowNumber: row.rowNumber,
        field: isActivityDataInputField(field) ? field : undefined,
        message: issue.message,
        value: isActivityDataInputField(field)
          ? String(candidate[field] ?? "")
          : undefined,
      };
    }),
  };
}

export function validateMappedActivityDataRequiredFields(
  candidate: Record<keyof ActivityDataInput, unknown>,
  rowNumber: number,
): ActivityDataWorkbookMappingIssue[] {
  return activityDataPrismaRequiredFields.flatMap((field) => {
    const value = candidate[field];

    if (!isMissingMappedValue(value)) {
      return [];
    }

    return [
      {
        rowNumber,
        field,
        message: requiredFieldMessages[field],
        value: "",
      },
    ];
  });
}

function detectActivityDataHeaderRowNumber(rows: readonly WorksheetRow[]) {
  const headerRow = rows.find((row) =>
    ACTIVITY_DATA_HEADER_ROW.every(
      (header, index) => normalizeWorkbookText(row.values[index] ?? "") === header,
    ),
  );

  return headerRow?.rowNumber ?? 0;
}

function hasActivityDataCandidateValues(row: WorksheetRow) {
  return row.values
    .slice(0, ACTIVITY_DATA_HEADER_ROW.length)
    .some((value) => normalizeWorkbookText(value).length > 0);
}

function normalizeWorkbookText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeWorkbookDate(value: string) {
  const normalizedValue = normalizeWorkbookText(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  const serialDate = Number(normalizedValue);

  if (Number.isInteger(serialDate) && serialDate > 0) {
    const date = new Date(Date.UTC(1899, 11, 30 + serialDate));

    return date.toISOString().slice(0, 10);
  }

  return normalizedValue;
}

function normalizeWorkbookActivityType(value: string) {
  const normalizedValue = normalizeWorkbookText(value);

  return activityTypeByWorkbookValue[normalizedValue] ?? normalizedValue;
}

function normalizeWorkbookAmount(value: string) {
  return normalizeWorkbookText(value).replace(/,/g, "");
}

function normalizeWorkbookUnit(value: string) {
  const normalizedValue = normalizeWorkbookText(value);

  return unitByWorkbookValue[normalizedValue.toLowerCase()] ?? normalizedValue;
}

function isMissingMappedValue(value: unknown) {
  return value === undefined || value === null || String(value).trim() === "";
}

function isActivityDataInputField(
  value: unknown,
): value is keyof ActivityDataInput {
  return (
    value === "productId" ||
    value === "date" ||
    value === "activityType" ||
    value === "description" ||
    value === "amount" ||
    value === "unit"
  );
}
