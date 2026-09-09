import { isIP } from "node:net";

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
  var webagentRateLimitNextCleanupAt: number | undefined;
}

export const RATE_LIMIT_STORE_MAX_ENTRIES = 10_000;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000;
const DIRECT_CLIENT_KEY = "direct";
const UNKNOWN_PROXY_CLIENT_KEY = "proxy-unknown";

function getStore() {
  if (!globalThis.webagentRateLimitStore) {
    globalThis.webagentRateLimitStore = new Map();
  }

  return globalThis.webagentRateLimitStore;
}

function normalizeIp(value: string | null) {
  const candidate = value?.trim();
  const version = candidate ? isIP(candidate) : 0;

  if (version === 4) {
    return candidate;
  }

  if (version === 6) {
    return new URL(`http://[${candidate}]/`).hostname.slice(1, -1);
  }

  return undefined;
}

function getClientIp(request: Request) {
  if (process.env.RATE_LIMIT_TRUST_PROXY !== "true") {
    return DIRECT_CLIENT_KEY;
  }

  return (
    normalizeIp(request.headers.get("x-real-ip")) ?? UNKNOWN_PROXY_CLIENT_KEY
  );
}

function getRateLimitKey(request: Request, bucket: string) {
  return `${bucket}:${getClientIp(request)}`;
}

function cleanupExpiredEntries(store: Map<string, RateLimitEntry>, now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }

  globalThis.webagentRateLimitNextCleanupAt =
    now + RATE_LIMIT_CLEANUP_INTERVAL_MS;
}

function getStoreRetryAfterSeconds(
  store: Map<string, RateLimitEntry>,
  now: number,
) {
  let earliestResetAt = Number.POSITIVE_INFINITY;

  for (const entry of store.values()) {
    earliestResetAt = Math.min(earliestResetAt, entry.resetAt);
  }

  return Number.isFinite(earliestResetAt)
    ? Math.max(1, Math.ceil((earliestResetAt - now) / 1000))
    : 1;
}

export function checkRateLimit(
  request: Request,
  bucket: string,
  options: RateLimitOptions,
) {
  const now = Date.now();
  const key = getRateLimitKey(request, bucket);
  const store = getStore();

  if (
    globalThis.webagentRateLimitNextCleanupAt === undefined ||
    globalThis.webagentRateLimitNextCleanupAt <= now
  ) {
    cleanupExpiredEntries(store, now);
  }

  let current = store.get(key);

  if (current?.resetAt && current.resetAt <= now) {
    store.delete(key);
    current = undefined;
  }

  if (!current) {
    if (store.size >= RATE_LIMIT_STORE_MAX_ENTRIES) {
      cleanupExpiredEntries(store, now);
    }

    if (store.size >= RATE_LIMIT_STORE_MAX_ENTRIES) {
      return {
        ok: false,
        retryAfterSeconds: getStoreRetryAfterSeconds(store, now),
      } as const;
    }

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

export function resetRateLimit(request: Request, bucket: string) {
  getStore().delete(getRateLimitKey(request, bucket));
}

export function clearRateLimitStore() {
  getStore().clear();
  globalThis.webagentRateLimitNextCleanupAt = undefined;
}

export function getRateLimitStoreSize() {
  return getStore().size;
}
