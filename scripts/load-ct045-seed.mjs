import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const prismaDir = path.join(projectRoot, "prisma");
const seedSqlPath = path.join(prismaDir, "seed-ct045-activity-data.sql");
const emissionFactorSeedPath = path.join(
  projectRoot,
  "src/entities/emission-factor/model/ct045-emission-factor-seed.json",
);
const activityTypes = new Set(["ELECTRICITY", "RAW_MATERIAL", "TRANSPORT"]);
const emissionFactorUnits = new Set([
  "kgCO2e/kWh",
  "kgCO2e/kg",
  "kgCO2e/ton-km",
]);
const ghgScopes = new Set(["SCOPE_2", "SCOPE_3"]);

function resolveSqlitePath(databaseUrl = "file:./dev.db") {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      `Only SQLite file: DATABASE_URL values are supported by this local seed loader. Received: ${databaseUrl}`,
    );
  }

  const filePath = databaseUrl.slice("file:".length);

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(prismaDir, filePath);
}

function runSqlite(args, options = {}) {
  const result = spawnSync("sqlite3", args, {
    cwd: projectRoot,
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      result.stderr || `sqlite3 exited with status ${result.status}`,
    );
  }

  return result.stdout.trim();
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNullableString(value) {
  return value === null ? "NULL" : sqlString(value);
}

function sqlInList(values) {
  return values.map(sqlString).join(",\n      ");
}

function querySingleInteger(databasePath, sql) {
  const output = runSqlite([databasePath], {
    input: `.mode list\n${sql.trim()}`,
  });
  const value = Number.parseInt(output, 10);

  if (!Number.isInteger(value)) {
    throw new Error(
      `Expected a single integer from sqlite3, received: ${output}`,
    );
  }

  return value;
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function loadEmissionFactorSeedRows() {
  if (!existsSync(emissionFactorSeedPath)) {
    throw new Error(
      `Emission factor seed JSON file not found: ${emissionFactorSeedPath}`,
    );
  }

  const rows = JSON.parse(readFileSync(emissionFactorSeedPath, "utf8"));

  if (!Array.isArray(rows) || rows.length !== 4) {
    throw new Error(
      `CT-045 emission factor seed file must contain exactly 4 rows. Received ${Array.isArray(rows) ? rows.length : typeof rows}.`,
    );
  }

  for (const [index, row] of rows.entries()) {
    const rowLabel = `CT-045 emission factor seed row ${index + 1}`;

    if (typeof row.id !== "string" || row.id.trim() === "") {
      throw new Error(`${rowLabel} has an invalid id.`);
    }

    if (typeof row.factorKey !== "string" || row.factorKey.trim() === "") {
      throw new Error(`${rowLabel} has an invalid factorKey.`);
    }

    if (
      typeof row.version !== "number" ||
      !Number.isInteger(row.version) ||
      row.version <= 0
    ) {
      throw new Error(`${rowLabel} has an invalid version: ${row.version}`);
    }

    if (!activityTypes.has(row.activityType)) {
      throw new Error(
        `${rowLabel} has an invalid activityType: ${row.activityType}`,
      );
    }

    if (typeof row.description !== "string" || row.description.trim() === "") {
      throw new Error(`${rowLabel} has an invalid description.`);
    }

    if (
      typeof row.value !== "number" ||
      !Number.isFinite(row.value) ||
      row.value <= 0
    ) {
      throw new Error(`${rowLabel} has an invalid value: ${row.value}`);
    }

    if (!emissionFactorUnits.has(row.unit)) {
      throw new Error(`${rowLabel} has an invalid unit: ${row.unit}`);
    }

    if (!ghgScopes.has(row.scope)) {
      throw new Error(`${rowLabel} has an invalid scope: ${row.scope}`);
    }

    if (!isIsoDate(row.validFrom)) {
      throw new Error(`${rowLabel} has an invalid validFrom: ${row.validFrom}`);
    }

    if (row.validTo !== null && !isIsoDate(row.validTo)) {
      throw new Error(`${rowLabel} has an invalid validTo: ${row.validTo}`);
    }
  }

  return rows;
}

function buildEmissionFactorSeedSql(rows) {
  const valuesSql = rows
    .map(
      (row) =>
        `  (${sqlString(row.id)}, ${sqlString(row.factorKey)}, ${row.version}, ${sqlString(row.activityType)}, ${sqlString(row.description)}, ${row.value}, ${sqlString(row.unit)}, ${sqlString(row.scope)}, ${sqlString(row.validFrom)}, ${sqlNullableString(row.validTo)}, CURRENT_TIMESTAMP)`,
    )
    .join(",\n");

  return `
INSERT INTO "emission_factors" (
  "id",
  "factorKey",
  "version",
  "activityType",
  "description",
  "value",
  "unit",
  "scope",
  "validFrom",
  "validTo",
  "updatedAt"
)
VALUES
${valuesSql}
ON CONFLICT("factorKey", "version") DO UPDATE SET
  "id" = excluded."id",
  "factorKey" = excluded."factorKey",
  "version" = excluded."version",
  "description" = excluded."description",
  "activityType" = excluded."activityType",
  "value" = excluded."value",
  "unit" = excluded."unit",
  "scope" = excluded."scope",
  "validFrom" = excluded."validFrom",
  "validTo" = excluded."validTo",
  "updatedAt" = CURRENT_TIMESTAMP;
`;
}

function assertSeedValidation(databasePath, emissionFactorSeedRows) {
  const emissionFactorSeedIds = emissionFactorSeedRows.map((row) => row.id);
  const productCount = querySingleInteger(
    databasePath,
    `
    SELECT COUNT(*)
    FROM products
    WHERE code = 'CT-045'
      AND TRIM(code) <> ''
      AND TRIM(name) <> '';
    `,
  );

  if (productCount !== 1) {
    throw new Error(
      `CT-045 product seed validation failed: expected 1 valid product, received ${productCount}.`,
    );
  }

  const seededActivityRows = querySingleInteger(
    databasePath,
    `
    SELECT COUNT(*)
    FROM activity_data
    WHERE productId = (SELECT id FROM products WHERE code = 'CT-045');
    `,
  );

  if (seededActivityRows !== 29) {
    throw new Error(
      `CT-045 activity seed validation failed: expected 29 rows, received ${seededActivityRows}.`,
    );
  }

  const seededEmissionFactorRows = querySingleInteger(
    databasePath,
    `
    SELECT COUNT(*)
    FROM emission_factors
    WHERE id IN (
      ${sqlInList(emissionFactorSeedIds)}
    );
    `,
  );

  if (seededEmissionFactorRows !== emissionFactorSeedRows.length) {
    throw new Error(
      `CT-045 emission factor seed validation failed: expected ${emissionFactorSeedRows.length} rows, received ${seededEmissionFactorRows}.`,
    );
  }

  const invalidRequiredFields = querySingleInteger(
    databasePath,
    `
    SELECT COUNT(*)
    FROM activity_data
    WHERE productId = (SELECT id FROM products WHERE code = 'CT-045')
      AND (
        productId IS NULL
        OR TRIM(productId) = ''
        OR date IS NULL
        OR date(date) IS NULL
        OR activityType NOT IN ('ELECTRICITY', 'RAW_MATERIAL', 'TRANSPORT')
        OR description IS NULL
        OR TRIM(description) = ''
        OR amount IS NULL
        OR amount <= 0
        OR unit NOT IN ('kWh', 'kg', 'ton-km')
      );
    `,
  );

  if (invalidRequiredFields !== 0) {
    throw new Error(
      `CT-045 activity seed validation failed: ${invalidRequiredFields} rows have invalid required fields.`,
    );
  }

  const invalidEmissionFactorRequiredFields = querySingleInteger(
    databasePath,
    `
    SELECT COUNT(*)
    FROM emission_factors
    WHERE id IN (
      ${sqlInList(emissionFactorSeedIds)}
    )
      AND (
        factorKey IS NULL
        OR TRIM(factorKey) = ''
        OR version IS NULL
        OR version <= 0
        OR activityType NOT IN ('ELECTRICITY', 'RAW_MATERIAL', 'TRANSPORT')
        OR description IS NULL
        OR TRIM(description) = ''
        OR value IS NULL
        OR value <= 0
        OR unit NOT IN ('kgCO2e/kWh', 'kgCO2e/kg', 'kgCO2e/ton-km')
        OR scope NOT IN ('SCOPE_2', 'SCOPE_3')
        OR validFrom IS NULL
        OR date(validFrom) IS NULL
        OR (validTo IS NOT NULL AND date(validTo) IS NULL)
      );
    `,
  );

  if (invalidEmissionFactorRequiredFields !== 0) {
    throw new Error(
      `CT-045 emission factor seed validation failed: ${invalidEmissionFactorRequiredFields} rows have invalid required fields.`,
    );
  }
}

const databasePath = resolveSqlitePath(process.env.DATABASE_URL);
const emissionFactorSeedRows = loadEmissionFactorSeedRows();

if (!existsSync(seedSqlPath)) {
  throw new Error(`Seed SQL file not found: ${seedSqlPath}`);
}

if (!existsSync(databasePath)) {
  throw new Error(
    `SQLite database not found: ${databasePath}. Apply the Prisma migration before seeding.`,
  );
}

runSqlite([databasePath], {
  input: buildEmissionFactorSeedSql(emissionFactorSeedRows),
});

runSqlite([databasePath], {
  input: readFileSync(seedSqlPath, "utf8"),
});

assertSeedValidation(databasePath, emissionFactorSeedRows);

const verificationSql = `
.headers on
.mode column
SELECT 'products' AS table_name, COUNT(*) AS seeded_rows
FROM products
WHERE code = 'CT-045'
UNION ALL
SELECT 'activity_data' AS table_name, COUNT(*) AS seeded_rows
FROM activity_data
WHERE productId = (SELECT id FROM products WHERE code = 'CT-045')
UNION ALL
SELECT 'emission_factors' AS table_name, COUNT(*) AS seeded_rows
FROM emission_factors
WHERE id IN (
  ${sqlInList(emissionFactorSeedRows.map((row) => row.id))}
);

SELECT activityType, COUNT(*) AS rows, unit
FROM activity_data
WHERE productId = (SELECT id FROM products WHERE code = 'CT-045')
GROUP BY activityType, unit
ORDER BY activityType;

SELECT factorKey, version, activityType, scope, value, unit, validFrom, validTo
FROM emission_factors
WHERE id IN (
  ${sqlInList(emissionFactorSeedRows.map((row) => row.id))}
)
ORDER BY factorKey, version;
`;

const verification = runSqlite([databasePath], {
  input: verificationSql,
});

console.log(`Loaded CT-045 seed data into ${databasePath}`);
console.log(
  `Validated CT-045 seed result: 29 activity rows, ${emissionFactorSeedRows.length} emission factor rows, and required fields are valid.`,
);
console.log(verification);
