import { z } from "zod";

import {
  type ActivityType,
  activityTypeSchema,
  type ActivityUnit,
  activityUnitSchema,
} from "./ct045-activity-seed";

export const activityDataInputConstraints = {
  productIdMaxLength: 64,
  descriptionMaxLength: 120,
  amountMax: 1_000_000,
  minDate: "2020-01-01",
  maxDate: "2035-12-31",
} as const;

export const activityUnitsByType = {
  ELECTRICITY: ["kWh"],
  RAW_MATERIAL: ["kg"],
  TRANSPORT: ["ton-km"],
} as const satisfies Record<ActivityType, readonly ActivityUnit[]>;

export const activityDataInputSchema = z
  .object({
    productId: z
      .string()
      .trim()
      .min(1, "제품은 필수입니다.")
      .max(
        activityDataInputConstraints.productIdMaxLength,
        "제품 식별자가 너무 깁니다.",
      ),
    date: z.iso.date().refine(
      (date) =>
        date >= activityDataInputConstraints.minDate &&
        date <= activityDataInputConstraints.maxDate,
      "활동 일자는 2020-01-01부터 2035-12-31 사이여야 합니다.",
    ),
    activityType: activityTypeSchema,
    description: z
      .string()
      .trim()
      .min(1, "활동 설명은 필수입니다.")
      .max(
        activityDataInputConstraints.descriptionMaxLength,
        "활동 설명은 120자 이하여야 합니다.",
      ),
    amount: z.coerce
      .number()
      .refine(Number.isFinite, "활동량은 유효한 숫자여야 합니다.")
      .positive("활동량은 0보다 커야 합니다.")
      .max(
        activityDataInputConstraints.amountMax,
        "활동량은 1,000,000 이하여야 합니다.",
      ),
    unit: activityUnitSchema,
  })
  .strict()
  .superRefine((input, context) => {
    const allowedUnits: readonly ActivityUnit[] =
      activityUnitsByType[input.activityType];

    if (!allowedUnits.includes(input.unit)) {
      context.addIssue({
        code: "custom",
        path: ["unit"],
        message: `${input.activityType} 활동은 ${allowedUnits.join(", ")} 단위만 사용할 수 있습니다.`,
      });
    }
  });

export type ActivityDataInput = z.infer<typeof activityDataInputSchema>;
