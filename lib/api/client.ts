type RequestJsonOptions = {
  timeoutMs?: number;
  retries?: number;
};

type ClientRequestErrorKind = "aborted" | "invalid-response" | "network" | "timeout";

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

export class ClientRequestError extends Error {
  constructor(
    message: string,
    readonly kind: ClientRequestErrorKind,
  ) {
    super(message);
    this.name = "ClientRequestError";
  }
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: RequestJsonOptions = {},
) {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const retries = options.retries ?? 0;

  if (init.signal?.aborted) {
    throw new ClientRequestError("요청이 취소되었습니다.", "aborted");
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    let timedOut = false;
    const abortFromCaller = () => controller.abort(init.signal?.reason);
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    init.signal?.addEventListener("abort", abortFromCaller, { once: true });

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      if (
        RETRYABLE_STATUS_CODES.has(response.status) &&
        attempt < retries
      ) {
        continue;
      }

      try {
        const data = (await response.json()) as T;
        return { response, data };
      } catch {
        if (attempt < retries) {
          continue;
        }

        throw new ClientRequestError(
          "서버 응답을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.",
          "invalid-response",
        );
      }
    } catch (error) {
      if (init.signal?.aborted) {
        throw new ClientRequestError("요청이 취소되었습니다.", "aborted");
      }

      if (attempt < retries) {
        continue;
      }

      if (error instanceof ClientRequestError) {
        throw error;
      }

      if (timedOut) {
        throw new ClientRequestError(
          "요청 시간이 초과되었습니다. 네트워크를 확인하고 다시 시도해 주세요.",
          "timeout",
        );
      }

      throw new ClientRequestError(
        "서버에 연결할 수 없습니다. 네트워크를 확인하고 다시 시도해 주세요.",
        "network",
      );
    } finally {
      clearTimeout(timeout);
      init.signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  throw new ClientRequestError(
    "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    "network",
  );
}

export function getClientErrorMessage(error: unknown, fallback: string) {
  return error instanceof ClientRequestError ? error.message : fallback;
}
