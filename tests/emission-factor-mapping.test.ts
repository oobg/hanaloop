import assert from "node:assert/strict";
import test from "node:test";

import { ct045ActivitySeedRows } from "../src/entities/activity-data";
import {
  mapActivityDataToEmissionFactor,
  validatedCt045EmissionFactorSeedRows,
} from "../src/entities/emission-factor";

test("maps electricity activity data to the Scope 2 electricity factor", () => {
  const result = mapActivityDataToEmissionFactor({
    date: "2026-02-06",
    activityType: "ELECTRICITY",
    description: "번인 테스트 전력 사용",
  });

  assert.equal(result?.factor.id, "ct045-ef-electricity-kr-2026");
  assert.equal(result?.factor.scope, "SCOPE_2");
  assert.equal(result?.matchedBy, "ACTIVITY_TYPE_DESCRIPTION");
});

test("maps raw material activity data to the CT-045 material factor", () => {
  const result = mapActivityDataToEmissionFactor({
    date: "2026-01-09",
    activityType: "RAW_MATERIAL",
    description: "PCB 조립품",
  });

  assert.equal(result?.factor.id, "ct045-ef-raw-material-display-2026");
  assert.equal(result?.factor.scope, "SCOPE_3");
});

test("distinguishes road and sea transport factors by activity description", () => {
  const roadResult = mapActivityDataToEmissionFactor({
    date: "2026-03-07",
    activityType: "TRANSPORT",
    description: "완제품 물류센터 이동",
  });
  const seaResult = mapActivityDataToEmissionFactor({
    date: "2026-03-12",
    activityType: "TRANSPORT",
    description: "수출 해상 간선 운송",
  });

  assert.equal(roadResult?.factor.id, "ct045-ef-road-freight-2026");
  assert.equal(roadResult?.validity, "VALID_ON_ACTIVITY_DATE");
  assert.equal(seaResult?.factor.id, "ct045-ef-sea-freight-2026");
  assert.equal(seaResult?.validity, "OUT_OF_RANGE_ON_ACTIVITY_DATE");
});

test("maps every CT-045 seed activity row to one emission factor", () => {
  const mappedFactorIds = ct045ActivitySeedRows.map((row) => {
    const result = mapActivityDataToEmissionFactor(row);

    assert.ok(result, `${row.id} should map to an emission factor`);

    return result.factor.id;
  });

  assert.equal(
    mappedFactorIds.filter((id) => id === "ct045-ef-electricity-kr-2026")
      .length,
    8,
  );
  assert.equal(
    mappedFactorIds.filter((id) => id === "ct045-ef-raw-material-display-2026")
      .length,
    10,
  );
  assert.equal(
    mappedFactorIds.filter((id) => id === "ct045-ef-road-freight-2026").length,
    10,
  );
  assert.equal(
    mappedFactorIds.filter((id) => id === "ct045-ef-sea-freight-2026").length,
    1,
  );
});

test("returns null when no factor has the same activity type", () => {
  const result = mapActivityDataToEmissionFactor(
    {
      date: "2026-02-06",
      activityType: "ELECTRICITY",
      description: "전력 사용",
    },
    validatedCt045EmissionFactorSeedRows.filter(
      (factor) => factor.activityType !== "ELECTRICITY",
    ),
  );

  assert.equal(result, null);
});
