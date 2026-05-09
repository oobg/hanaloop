import assert from "node:assert/strict";
import test from "node:test";

import {
  clearActivityDataMutationFieldErrors,
  toActivityDataMutationFieldErrors,
} from "../src/features/activity-manual-entry/model/activity-data-api";

test("converts validation failures into field-name keyed form errors", () => {
  const fieldErrors = toActivityDataMutationFieldErrors({
    productId: ["제품은 필수입니다."],
    amount: ["활동량은 0보다 커야 합니다."],
    date: [],
    extraColumn: ["허용되지 않는 필드입니다."],
  });

  assert.deepEqual(fieldErrors, {
    productId: ["제품은 필수입니다."],
    amount: ["활동량은 0보다 커야 합니다."],
  });
});

test("returns an empty field error state when validation has no field errors", () => {
  assert.deepEqual(toActivityDataMutationFieldErrors(undefined), {});
  assert.deepEqual(toActivityDataMutationFieldErrors({}), {});
});

test("removes only edited field errors from the manual entry error state", () => {
  assert.deepEqual(
    clearActivityDataMutationFieldErrors(
      {
        amount: ["활동량은 0보다 커야 합니다."],
        description: ["활동 설명은 필수입니다."],
      },
      ["amount"],
    ),
    {
      description: ["활동 설명은 필수입니다."],
    },
  );
});

test("removes dependent activity type and unit errors together", () => {
  assert.deepEqual(
    clearActivityDataMutationFieldErrors(
      {
        activityType: ["활동 유형이 올바르지 않습니다."],
        unit: ["전력 사용은 kWh 단위만 사용할 수 있습니다."],
        date: ["활동 일자는 2020-01-01부터 2035-12-31 사이여야 합니다."],
      },
      ["activityType", "unit"],
    ),
    {
      date: ["활동 일자는 2020-01-01부터 2035-12-31 사이여야 합니다."],
    },
  );
});

test("replaces stale field errors with the latest server validation result", () => {
  const previousFieldErrors = {
    amount: ["활동량은 0보다 커야 합니다."],
    description: ["활동 설명은 필수입니다."],
  };
  const latestFieldErrors = toActivityDataMutationFieldErrors({
    amount: ["활동량은 1,000,000 이하여야 합니다."],
  });
  const nextFieldErrors = latestFieldErrors;

  assert.notDeepEqual(nextFieldErrors, previousFieldErrors);
  assert.deepEqual(nextFieldErrors, {
    amount: ["활동량은 1,000,000 이하여야 합니다."],
  });
});
