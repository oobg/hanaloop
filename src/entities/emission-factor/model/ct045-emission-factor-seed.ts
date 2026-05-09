import { z } from "zod";

import { activityTypeSchema } from "../../activity-data";

import ct045EmissionFactorSeedRowsJson from "./ct045-emission-factor-seed.json";

export const ghgScopeSchema = z.enum(["SCOPE_2", "SCOPE_3"]);

export const emissionFactorUnitSchema = z.enum([
  "kgCO2e/kWh",
  "kgCO2e/kg",
  "kgCO2e/ton-km",
]);

export const emissionFactorPrismaRequiredFields = [
  "factorKey",
  "version",
  "activityType",
  "description",
  "value",
  "unit",
  "scope",
  "validFrom",
] as const;

export const ct045EmissionFactorSeedRequiredFields = [
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
] as const;

export const ct045EmissionFactorSeedRowSchema = z.object({
  id: z.string().min(1),
  factorKey: z.string().min(1),
  version: z.number().int().positive(),
  activityType: activityTypeSchema,
  description: z.string().min(1),
  value: z.number().positive(),
  unit: emissionFactorUnitSchema,
  scope: ghgScopeSchema,
  validFrom: z.iso.date(),
  validTo: z.iso.date().nullable(),
});

export const ct045EmissionFactorSeedSchema = z
  .array(ct045EmissionFactorSeedRowSchema)
  .length(4);

export type GhgScope = z.infer<typeof ghgScopeSchema>;
export type EmissionFactorUnit = z.infer<typeof emissionFactorUnitSchema>;
export type Ct045EmissionFactorSeedRow = z.infer<
  typeof ct045EmissionFactorSeedRowSchema
>;
export type EmissionFactorPrismaRequiredField =
  (typeof emissionFactorPrismaRequiredFields)[number];
export type Ct045EmissionFactorSeedRequiredField =
  (typeof ct045EmissionFactorSeedRequiredFields)[number];

export const ct045EmissionFactorSeedRows = ct045EmissionFactorSeedSchema.parse(
  ct045EmissionFactorSeedRowsJson,
);

export const validatedCt045EmissionFactorSeedRows =
  ct045EmissionFactorSeedRows satisfies Ct045EmissionFactorSeedRow[];
