import { z } from "zod";

function blankToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

export function optionalString(maxLength?: number) {
  const schema = z.preprocess(blankToUndefined, z.string().trim().optional());

  if (!maxLength) {
    return schema;
  }

  return schema.refine((value) => !value || value.length <= maxLength, {
    message: `Must be ${maxLength} characters or fewer.`,
  });
}

export const optionalPositiveInt = z.preprocess(
  blankToUndefined,
  z.coerce.number().int().positive().optional(),
);

export const optionalNonNegativeInt = z.preprocess(
  blankToUndefined,
  z.coerce.number().int().nonnegative().optional(),
);

export const optionalNonNegativeNumber = z.preprocess(
  blankToUndefined,
  z.coerce.number().nonnegative().optional(),
);

export const optionalDate = z.preprocess(
  blankToUndefined,
  z.coerce.date().optional(),
);
