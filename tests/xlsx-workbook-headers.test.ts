import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  extractSharedStringsFromXml,
  extractWorksheetRowsFromXml,
  getActivityTemplateHeaderValidation,
  validateWorksheetHeaders,
} from "../src/features/activity-upload/model/xlsx-workbook-sheets";

test("detects required header rows from the original activity workbook", async () => {
  const workbook = readFileSync(".test/2026년_개발자_채용과제.xlsx");
  const file = new File([new Uint8Array(workbook)], "activity-template.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const result = await getActivityTemplateHeaderValidation(file);

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.sheets.map((sheet) => ({
      sheetName: sheet.sheetName,
      rowNumbers: sheet.headerGroups.map((group) => group.detectedRowNumber),
    })),
    [
      { sheetName: "과제 개요", rowNumbers: [12] },
      { sheetName: "과제용 데이터", rowNumbers: [3, 4] },
      { sheetName: "지원자 체크리스트", rowNumbers: [2] },
    ],
  );
});

test("reports missing required headers for the closest candidate row", () => {
  const result = validateWorksheetHeaders(
    "과제용 데이터",
    [
      {
        rowNumber: 3,
        values: ["일자(원본)", "활동 유형", "설명", "단위"],
      },
    ],
    [["일자(원본)", "활동 유형", "설명", "량", "단위"]],
  );

  assert.equal(result.ok, false);
  assert.equal(result.headerGroups[0].detectedRowNumber, 3);
  assert.deepEqual(result.headerGroups[0].missingHeaders, ["량"]);
  assert.deepEqual(result.headerGroups[0].orderMismatches, []);
});

test("reports headers that exist in a different column order", () => {
  const result = validateWorksheetHeaders(
    "과제용 데이터",
    [
      {
        rowNumber: 3,
        values: ["일자(원본)", "활동 유형", "설명", "단위", "량"],
      },
    ],
    [["일자(원본)", "활동 유형", "설명", "량", "단위"]],
  );

  assert.equal(result.ok, false);
  assert.equal(result.headerGroups[0].detectedRowNumber, 3);
  assert.deepEqual(result.headerGroups[0].missingHeaders, []);
  assert.deepEqual(result.headerGroups[0].orderMismatches, [
    {
      expectedHeader: "량",
      expectedIndex: 3,
      actualIndex: 4,
      actualHeaderAtExpectedIndex: "단위",
    },
    {
      expectedHeader: "단위",
      expectedIndex: 4,
      actualIndex: 3,
      actualHeaderAtExpectedIndex: "량",
    },
  ]);
});

test("extracts worksheet rows using shared strings and inline strings", () => {
  const sharedStrings = extractSharedStringsFromXml(`
    <sst>
      <si><t>구분</t></si>
      <si><r><t>체크</t></r><r><t> 항목</t></r></si>
    </sst>
  `);
  const rows = extractWorksheetRowsFromXml(
    `
      <worksheet>
        <sheetData>
          <row r="2">
            <c r="B2" t="s"><v>0</v></c>
            <c r="C2" t="s"><v>1</v></c>
            <c r="D2" t="inlineStr"><is><t>비고</t></is></c>
          </row>
        </sheetData>
      </worksheet>
    `,
    sharedStrings,
  );

  assert.deepEqual(rows, [
    {
      rowNumber: 2,
      values: ["구분", "체크 항목", "비고"],
    },
  ]);
});
