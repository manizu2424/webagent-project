type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  var webagentRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getStore() {
  if (!globalThis.webagentRateLimitStore) {
    globalThis.webagentRateLimitStore = new Map();
  }

  return globalThis.webagentRateLimitStore;
}

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export function checkRateLimit(
  request: Request,
  bucket: string,
  options: RateLimitOptions,
) {
  const now = Date.now();
  const key = `${bucket}:${getClientIp(request)}`;
  const store = getStore();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return { ok: true } as const;
  }

  if (current.count >= options.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    } as const;
  }

  current.count += 1;
  store.set(key, current);

  return { ok: true } as const;
}
