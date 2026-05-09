-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "emission_factors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "activity_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "emissionFactorId" TEXT,
    "date" DATETIME NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "activity_data_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "activity_data_emissionFactorId_fkey" FOREIGN KEY ("emissionFactorId") REFERENCES "emission_factors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pcf_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "totalEmission" DECIMAL NOT NULL,
    "byScope" JSONB NOT NULL,
    "byCategory" JSONB NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pcf_results_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "emission_factors_activityType_unit_validFrom_key" ON "emission_factors"("activityType", "unit", "validFrom");

-- CreateIndex
CREATE INDEX "emission_factors_activityType_validFrom_validTo_idx" ON "emission_factors"("activityType", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "emission_factors_scope_idx" ON "emission_factors"("scope");

-- CreateIndex
CREATE INDEX "activity_data_productId_date_idx" ON "activity_data"("productId", "date");

-- CreateIndex
CREATE INDEX "activity_data_activityType_date_idx" ON "activity_data"("activityType", "date");

-- CreateIndex
CREATE INDEX "activity_data_emissionFactorId_idx" ON "activity_data"("emissionFactorId");

-- CreateIndex
CREATE UNIQUE INDEX "pcf_results_productId_periodStart_periodEnd_key" ON "pcf_results"("productId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "pcf_results_periodStart_periodEnd_idx" ON "pcf_results"("periodStart", "periodEnd");
