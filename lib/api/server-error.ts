import { randomUUID } from "crypto";
import { apiError } from "./responses";

type SafeLogValue = string | number | boolean | null | undefined;
type SafeLogContext = Record<string, SafeLogValue>;

const SAFE_ERROR_TYPES = new Set([
  "AbortError",
  "DrizzleError",
  "DrizzleQueryError",
  "Error",
  "PostgresError",
  "RangeError",
  "SyntaxError",
  "TypeError",
]);

function getSafeErrorType(error: unknown) {
  if (!(error instanceof Error) || !SAFE_ERROR_TYPES.has(error.name)) {
    return "UnknownError";
  }

  return error.name;
}

function getSafeErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;

  if (typeof code !== "string" || !/^[A-Z0-9_-]{1,32}$/i.test(code)) {
    return undefined;
  }

  return code;
}

export function logServerError(
  event: string,
  error: unknown,
  context: SafeLogContext = {},
) {
  const requestId = context.requestId?.toString() ?? randomUUID();

  console.error(event, {
    ...context,
    requestId,
    errorType: getSafeErrorType(error),
    errorCode: getSafeErrorCode(error),
  });

  return requestId;
}

export function serverErrorResponse(
  message: string,
  status: number,
  event: string,
  error: unknown,
  context: SafeLogContext = {},
) {
  const requestId = logServerError(event, error, context);
  const response = apiError(message, status);
  response.headers.set("x-request-id", requestId);

  return response;
}
