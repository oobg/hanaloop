import assert from "node:assert/strict";
import test from "node:test";

import {
  mapXlsxActivityRowsToActivityDataInputs,
  mapXlsxActivityRowToActivityDataInput,
} from "../src/features/activity-upload/model/xlsx-activity-data-mapping";

test("maps workbook activity row columns to ActivityDataInput fields", () => {
  const result = mapXlsxActivityRowToActivityDataInput({
    rowNumber: 4,
    values: ["2025-01-01", "전기", "한국전력", "110.0", "kWh"],
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.input, {
    productId: "CT-045",
    date: "2025-01-01",
    activityType: "ELECTRICITY",
    description: "한국전력",
    amount: 110,
    unit: "kWh",
  });
});

test("maps all activity rows after the detected template header", () => {
  const result = mapXlsxActivityRowsToActivityDataInputs([
    {
      rowNumber: 3,
      values: ["일자(원본)", "활동 유형", "설명", "량", "단위"],
    },
    {
      rowNumber: 4,
      values: ["2025-08-01", "원소재", "플라스틱 1", "230", "kg"],
    },
    {
      rowNumber: 25,
      values: ["2025-01-01", "운송", "트럭", "41", "ton-km"],
    },
  ]);

  assert.equal(result.issues.length, 0);
  assert.deepEqual(
    result.inputs.map((input) => ({
      date: input.date,
      activityType: input.activityType,
      description: input.description,
      amount: input.amount,
      unit: input.unit,
    })),
    [
      {
        date: "2025-08-01",
        activityType: "RAW_MATERIAL",
        description: "플라스틱 1",
        amount: 230,
        unit: "kg",
      },
      {
        date: "2025-01-01",
        activityType: "TRANSPORT",
        description: "트럭",
        amount: 41,
        unit: "ton-km",
      },
    ],
  );
});

test("normalizes Excel serial dates, comma amounts, and product id option", () => {
  const result = mapXlsxActivityRowToActivityDataInput(
    {
      rowNumber: 8,
      values: ["45658", "ELECTRICITY", " 검사 설비  ", "1,200.5", "KWH"],
    },
    { productId: "ct-045" },
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.input, {
    productId: "ct-045",
    date: "2025-01-01",
    activityType: "ELECTRICITY",
    description: "검사 설비",
    amount: 1200.5,
    unit: "kWh",
  });
});

test("returns row-level mapping issues for invalid workbook values", () => {
  const result = mapXlsxActivityRowToActivityDataInput({
    rowNumber: 9,
    values: ["2019-12-31", "전기", "검사 설비", "-1", "kg"],
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }

  assert.deepEqual(
    result.issues.map((issue) => issue.field),
    ["date", "amount", "unit"],
  );
  assert.equal(result.issues.every((issue) => issue.rowNumber === 9), true);
});

test("returns required field issues for missing mapped activity values", () => {
  const result = mapXlsxActivityRowToActivityDataInput(
    {
      rowNumber: 10,
      values: ["", "", "", "", ""],
    },
    { productId: "" },
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }

  assert.deepEqual(
    result.issues.map((issue) => ({
      field: issue.field,
      message: issue.message,
      value: issue.value,
      rowNumber: issue.rowNumber,
    })),
    [
      {
        field: "productId",
        message: "제품은 필수입니다.",
        value: "",
        rowNumber: 10,
      },
      {
        field: "date",
        message: "활동 일자는 필수입니다.",
        value: "",
        rowNumber: 10,
      },
      {
        field: "activityType",
        message: "활동 유형은 필수입니다.",
        value: "",
        rowNumber: 10,
      },
      {
        field: "description",
        message: "활동 설명은 필수입니다.",
        value: "",
        rowNumber: 10,
      },
      {
        field: "amount",
        message: "활동량은 필수입니다.",
        value: "",
        rowNumber: 10,
      },
      {
        field: "unit",
        message: "단위는 필수입니다.",
        value: "",
        rowNumber: 10,
      },
    ],
  );
});
