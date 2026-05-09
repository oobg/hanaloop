import assert from "node:assert/strict";
import test from "node:test";

import {
  activityDataInputConstraints,
  activityDataInputSchema,
} from "../src/entities/activity-data/model/activity-data-input";

const validActivityDataInput = {
  productId: "CT-045",
  date: "2026-02-03",
  activityType: "ELECTRICITY",
  description: "SMT 라인 전력 사용",
  amount: 2.4,
  unit: "kWh",
} as const;

test("accepts valid activity data and normalizes user-entered strings", () => {
  const parsed = activityDataInputSchema.parse({
    ...validActivityDataInput,
    productId: "  CT-045  ",
    description: "  SMT 라인 전력 사용  ",
    amount: "2.4",
  });

  assert.deepEqual(parsed, {
    ...validActivityDataInput,
    productId: "CT-045",
    description: "SMT 라인 전력 사용",
  });
});

test("accepts the configured unit for each activity type", () => {
  const cases = [
    ["ELECTRICITY", "kWh"],
    ["RAW_MATERIAL", "kg"],
    ["TRANSPORT", "ton-km"],
  ] as const;

  for (const [activityType, unit] of cases) {
    const result = activityDataInputSchema.safeParse({
      ...validActivityDataInput,
      activityType,
      unit,
    });

    assert.equal(result.success, true, `${activityType} ${unit}`);
  }
});

test("rejects required field, date range, amount, and unknown field failures", () => {
  const result = activityDataInputSchema.safeParse({
    ...validActivityDataInput,
    productId: "",
    date: "2019-12-31",
    amount: activityDataInputConstraints.amountMax + 1,
    extraColumn: "not allowed",
  });

  assert.equal(result.success, false);
  if (result.success) {
    return;
  }

  const flattened = result.error.flatten();

  assert.match(flattened.fieldErrors.productId?.[0] ?? "", /제품은 필수/);
  assert.match(
    flattened.fieldErrors.date?.[0] ?? "",
    /2020-01-01부터 2035-12-31 사이/,
  );
  assert.match(
    flattened.fieldErrors.amount?.[0] ?? "",
    /1,000,000 이하여야 합니다/,
  );
  assert.match(flattened.formErrors[0] ?? "", /Unrecognized key/);
});

test("rejects non-positive amounts", () => {
  const result = activityDataInputSchema.safeParse({
    ...validActivityDataInput,
    amount: 0,
  });

  assert.equal(result.success, false);
  if (result.success) {
    return;
  }

  assert.match(
    result.error.flatten().fieldErrors.amount?.[0] ?? "",
    /0보다 커야 합니다/,
  );
});

test("rejects unit values that do not match the selected activity type", () => {
  const result = activityDataInputSchema.safeParse({
    ...validActivityDataInput,
    activityType: "ELECTRICITY",
    unit: "kg",
  });

  assert.equal(result.success, false);
  if (result.success) {
    return;
  }

  assert.match(
    result.error.flatten().fieldErrors.unit?.[0] ?? "",
    /ELECTRICITY 활동은 kWh 단위만 사용할 수 있습니다/,
  );
});
