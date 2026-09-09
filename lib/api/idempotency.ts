import { createHash } from "crypto";
import { z } from "zod";

const idempotencyKeySchema = z.string().uuid();

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortValue(nestedValue)]),
    );
  }

  return value;
}

export function getIdempotencyKey(request: Request) {
  const parsed = idempotencyKeySchema.safeParse(
    request.headers.get("idempotency-key"),
  );

  return parsed.success ? parsed.data : undefined;
}

export function createRequestFingerprint(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(sortValue(value)))
    .digest("hex");
}

export function isUniqueViolation(error: unknown) {
  let current = error;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object") {
      return false;
    }

    if (
      "code" in current &&
      (current as { code?: unknown }).code === "23505"
    ) {
      return true;
    }

    current = "cause" in current ? (current as { cause?: unknown }).cause : null;
  }

  return false;
}
