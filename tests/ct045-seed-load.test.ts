import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const migrationPath =
  "prisma/migrations/20260509043600_init_pcf_schema/migration.sql";

function runSqlite(databasePath: string, sql: string): string {
  const result = spawnSync("sqlite3", [databasePath], {
    encoding: "utf8",
    input: sql,
  });

  if (result.error) {
    throw result.error;
  }

  assert.equal(result.status, 0, result.stderr);

  return result.stdout.trim();
}

function runSeedLoader(databasePath: string): string {
  const result = spawnSync(process.execPath, ["scripts/load-ct045-seed.mjs"], {
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: `file:${databasePath}`,
    },
  });

  if (result.error) {
    throw result.error;
  }

  assert.equal(result.status, 0, result.stderr);

  return result.stdout;
}

function queryJson<T>(databasePath: string, sql: string): T {
  const output = runSqlite(
    databasePath,
    `.mode json
${sql.trim()}
`,
  );

  return JSON.parse(output) as T;
}

test("loads and verifies the CT-045 seed result in a disposable SQLite database", () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "hanaloop-seed-"));
  const databasePath = path.join(tempDir, "seed-result.db");

  try {
    runSqlite(databasePath, readFileSync(migrationPath, "utf8"));

    const firstRunOutput = runSeedLoader(databasePath);
    const secondRunOutput = runSeedLoader(databasePath);

    assert.match(firstRunOutput, /Validated CT-045 seed result/);
    assert.match(secondRunOutput, /Validated CT-045 seed result/);

    const [summary] = queryJson<
      Array<{
        productCount: number;
        activityCount: number;
        emissionFactorCount: number;
        invalidActivityRows: number;
        invalidEmissionFactorRows: number;
      }>
    >(
      databasePath,
      `
      SELECT
        (SELECT COUNT(*) FROM products WHERE code = 'CT-045') AS productCount,
        (
          SELECT COUNT(*)
          FROM activity_data
          WHERE productId = (SELECT id FROM products WHERE code = 'CT-045')
        ) AS activityCount,
        (
          SELECT COUNT(*)
          FROM emission_factors
          WHERE id LIKE 'ct045-ef-%'
        ) AS emissionFactorCount,
        (
          SELECT COUNT(*)
          FROM activity_data
          WHERE productId = (SELECT id FROM products WHERE code = 'CT-045')
            AND (
              date IS NULL
              OR date(date) IS NULL
              OR activityType NOT IN ('ELECTRICITY', 'RAW_MATERIAL', 'TRANSPORT')
              OR TRIM(description) = ''
              OR amount <= 0
              OR unit NOT IN ('kWh', 'kg', 'ton-km')
            )
        ) AS invalidActivityRows,
        (
          SELECT COUNT(*)
          FROM emission_factors
          WHERE id LIKE 'ct045-ef-%'
            AND (
              value <= 0
              OR factorKey IS NULL
              OR TRIM(factorKey) = ''
              OR version IS NULL
              OR version <= 0
              OR scope NOT IN ('SCOPE_2', 'SCOPE_3')
              OR unit NOT IN ('kgCO2e/kWh', 'kgCO2e/kg', 'kgCO2e/ton-km')
              OR date(validFrom) IS NULL
              OR (validTo IS NOT NULL AND date(validTo) IS NULL)
            )
        ) AS invalidEmissionFactorRows;
      `,
    );

    assert.deepEqual(summary, {
      productCount: 1,
      activityCount: 29,
      emissionFactorCount: 4,
      invalidActivityRows: 0,
      invalidEmissionFactorRows: 0,
    });

    const emissionFactorVersionIndexes = queryJson<
      Array<{ name: string; uniqueFlag: number }>
    >(
      databasePath,
      `
      SELECT name, [unique] AS uniqueFlag
      FROM pragma_index_list('emission_factors')
      WHERE name IN (
        'emission_factors_factorKey_version_key',
        'emission_factors_factorKey_validFrom_key',
        'emission_factors_factorKey_validFrom_validTo_idx'
      )
      ORDER BY name;
      `,
    );

    assert.deepEqual(emissionFactorVersionIndexes, [
      {
        name: "emission_factors_factorKey_validFrom_key",
        uniqueFlag: 1,
      },
      {
        name: "emission_factors_factorKey_validFrom_validTo_idx",
        uniqueFlag: 0,
      },
      {
        name: "emission_factors_factorKey_version_key",
        uniqueFlag: 1,
      },
    ]);

    const activityDistribution = queryJson<
      Array<{ activityType: string; rows: number; unit: string }>
    >(
      databasePath,
      `
      SELECT activityType, COUNT(*) AS rows, unit
      FROM activity_data
      WHERE productId = (SELECT id FROM products WHERE code = 'CT-045')
      GROUP BY activityType, unit
      ORDER BY activityType;
      `,
    );

    assert.deepEqual(activityDistribution, [
      { activityType: "ELECTRICITY", rows: 8, unit: "kWh" },
      { activityType: "RAW_MATERIAL", rows: 10, unit: "kg" },
      { activityType: "TRANSPORT", rows: 11, unit: "ton-km" },
    ]);

    const scopeDistribution = queryJson<Array<{ scope: string; rows: number }>>(
      databasePath,
      `
      SELECT scope, COUNT(*) AS rows
      FROM emission_factors
      WHERE id LIKE 'ct045-ef-%'
      GROUP BY scope
      ORDER BY scope;
      `,
    );

    assert.deepEqual(scopeDistribution, [
      { scope: "SCOPE_2", rows: 1 },
      { scope: "SCOPE_3", rows: 3 },
    ]);

    const emissionFactors = queryJson<
      Array<{
        id: string;
        factorKey: string;
        version: number;
        activityType: string;
        description: string;
        value: number;
        unit: string;
        scope: string;
        validFrom: string;
        validTo: string | null;
      }>
    >(
      databasePath,
      `
      SELECT
        id,
        factorKey,
        version,
        activityType,
        description,
        value,
        unit,
        scope,
        date(validFrom) AS validFrom,
        CASE WHEN validTo IS NULL THEN NULL ELSE date(validTo) END AS validTo
      FROM emission_factors
      WHERE id IN (
        'ct045-ef-electricity-kr-2026',
        'ct045-ef-raw-material-display-2026',
        'ct045-ef-road-freight-2026',
        'ct045-ef-sea-freight-2026'
      )
      ORDER BY id;
      `,
    );

    assert.deepEqual(emissionFactors, [
      {
        id: "ct045-ef-electricity-kr-2026",
        factorKey: "EF_ELECTRICITY_KR_AVERAGE",
        version: 1,
        activityType: "ELECTRICITY",
        description: "한국 전력 소비 평균 배출계수",
        value: 0.4594,
        unit: "kgCO2e/kWh",
        scope: "SCOPE_2",
        validFrom: "2026-01-01",
        validTo: null,
      },
      {
        id: "ct045-ef-raw-material-display-2026",
        factorKey: "EF_RAW_MATERIAL_CT045_DISPLAY",
        version: 1,
        activityType: "RAW_MATERIAL",
        description: "CT-045 원소재 투입 평균 배출계수",
        value: 4.82,
        unit: "kgCO2e/kg",
        scope: "SCOPE_3",
        validFrom: "2026-01-01",
        validTo: null,
      },
      {
        id: "ct045-ef-road-freight-2026",
        factorKey: "EF_TRANSPORT_CT045_FREIGHT",
        version: 1,
        activityType: "TRANSPORT",
        description: "부품 및 완제품 도로 운송 평균 배출계수",
        value: 0.162,
        unit: "kgCO2e/ton-km",
        scope: "SCOPE_3",
        validFrom: "2026-01-01",
        validTo: "2026-06-30",
      },
      {
        id: "ct045-ef-sea-freight-2026",
        factorKey: "EF_TRANSPORT_CT045_FREIGHT",
        version: 2,
        activityType: "TRANSPORT",
        description: "수출 해상 간선 운송 평균 배출계수",
        value: 0.018,
        unit: "kgCO2e/ton-km",
        scope: "SCOPE_3",
        validFrom: "2026-07-01",
        validTo: null,
      },
    ]);
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
});
