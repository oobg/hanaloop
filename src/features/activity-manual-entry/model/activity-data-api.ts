export type ActivityDataMutationField =
  | "productId"
  | "date"
  | "activityType"
  | "description"
  | "amount"
  | "unit";

export type ActivityDataMutationFieldErrors = Partial<
  Record<ActivityDataMutationField, string[]>
>;

const activityDataMutationFields = [
  "productId",
  "date",
  "activityType",
  "description",
  "amount",
  "unit",
] as const satisfies readonly ActivityDataMutationField[];

const activityDataMutationFieldSet = new Set<string>(
  activityDataMutationFields,
);

export function toActivityDataMutationFieldErrors(
  fieldErrors: Partial<Record<string, string[]>> | undefined,
): ActivityDataMutationFieldErrors {
  if (!fieldErrors) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fieldErrors).filter(
      (entry): entry is [ActivityDataMutationField, string[]] =>
        activityDataMutationFieldSet.has(entry[0]) &&
        Array.isArray(entry[1]) &&
        entry[1].length > 0,
    ),
  );
}

export function clearActivityDataMutationFieldErrors(
  fieldErrors: ActivityDataMutationFieldErrors,
  fields: readonly ActivityDataMutationField[],
): ActivityDataMutationFieldErrors {
  if (fields.every((field) => !fieldErrors[field])) {
    return fieldErrors;
  }

  const next = { ...fieldErrors };

  for (const field of fields) {
    delete next[field];
  }

  return next;
}

export type ActivityDataMutationError = {
  code: string;
  message: string;
  fieldErrors: ActivityDataMutationFieldErrors;
  formErrors: string[];
};

export type ActivityDataMutationResponse =
  | {
      ok: true;
      data: {
        id: string;
      };
    }
  | {
      ok: false;
      error: ActivityDataMutationError;
    };
