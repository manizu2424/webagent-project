import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  clearRateLimitStore,
  getRateLimitStoreSize,
  RATE_LIMIT_STORE_MAX_ENTRIES,
  resetRateLimit,
} from "./rate-limit";

const originalTrustProxy = process.env.RATE_LIMIT_TRUST_PROXY;

function createRequest(ip: string, forwardedFor?: string) {
  const headers = new Headers({ "x-real-ip": ip });

  if (forwardedFor) {
    headers.set("x-forwarded-for", forwardedFor);
  }

  return new Request("http://localhost/api", { headers });
}

describe("checkRateLimit", () => {
  beforeEach(() => {
    clearRateLimitStore();
    process.env.RATE_LIMIT_TRUST_PROXY = "true";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearRateLimitStore();

    if (originalTrustProxy === undefined) {
      delete process.env.RATE_LIMIT_TRUST_PROXY;
    } else {
      process.env.RATE_LIMIT_TRUST_PROXY = originalTrustProxy;
    }
  });

  it("allows requests within the limit", () => {
    const request = createRequest("192.0.2.1");

    expect(checkRateLimit(request, "test-allowed", { limit: 2, windowMs: 1000 }))
      .toMatchObject({ ok: true });
    expect(checkRateLimit(request, "test-allowed", { limit: 2, windowMs: 1000 }))
      .toMatchObject({ ok: true });
  });

  it("blocks requests over the limit", () => {
    const request = createRequest("192.0.2.2");

    checkRateLimit(request, "test-blocked", { limit: 1, windowMs: 1000 });

    expect(checkRateLimit(request, "test-blocked", { limit: 1, windowMs: 1000 }))
      .toMatchObject({ ok: false });
  });

  it("allows requests again after the bucket is reset", () => {
    const request = createRequest("192.0.2.3");

    checkRateLimit(request, "test-reset", { limit: 1, windowMs: 1000 });
    resetRateLimit(request, "test-reset");

    expect(checkRateLimit(request, "test-reset", { limit: 1, windowMs: 1000 }))
      .toMatchObject({ ok: true });
  });

  it("ignores client-supplied forwarding headers unless proxy trust is enabled", () => {
    process.env.RATE_LIMIT_TRUST_PROXY = "false";
    const firstRequest = createRequest("192.0.2.4", "198.51.100.1");
    const secondRequest = createRequest("192.0.2.5", "198.51.100.2");

    expect(
      checkRateLimit(firstRequest, "test-untrusted", {
        limit: 1,
        windowMs: 1000,
      }),
    ).toMatchObject({ ok: true });
    expect(
      checkRateLimit(secondRequest, "test-untrusted", {
        limit: 1,
        windowMs: 1000,
      }),
    ).toMatchObject({ ok: false });
  });

  it("uses only the proxy-overwritten X-Real-IP header", () => {
    const firstRequest = createRequest("192.0.2.6", "198.51.100.1");
    const spoofedForwardingRequest = createRequest(
      "192.0.2.6",
      "203.0.113.200",
    );
    const otherClientRequest = createRequest("192.0.2.7", "198.51.100.1");

    expect(
      checkRateLimit(firstRequest, "test-trusted", {
        limit: 1,
        windowMs: 1000,
      }),
    ).toMatchObject({ ok: true });
    expect(
      checkRateLimit(spoofedForwardingRequest, "test-trusted", {
        limit: 1,
        windowMs: 1000,
      }),
    ).toMatchObject({ ok: false });
    expect(
      checkRateLimit(otherClientRequest, "test-trusted", {
        limit: 1,
        windowMs: 1000,
      }),
    ).toMatchObject({ ok: true });
  });

  it("shares a fail-closed bucket when the trusted IP header is invalid", () => {
    const firstRequest = createRequest("not-an-ip", "198.51.100.1");
    const secondRequest = createRequest("also-not-an-ip", "198.51.100.2");

    checkRateLimit(firstRequest, "test-invalid-ip", {
      limit: 1,
      windowMs: 1000,
    });

    expect(
      checkRateLimit(secondRequest, "test-invalid-ip", {
        limit: 1,
        windowMs: 1000,
      }),
    ).toMatchObject({ ok: false });
  });

  it("normalizes equivalent IPv6 addresses into the same bucket", () => {
    const firstRequest = createRequest("2001:0db8:0:0:0:0:0:1");
    const secondRequest = createRequest("2001:db8::1");

    checkRateLimit(firstRequest, "test-ipv6", { limit: 1, windowMs: 1000 });

    expect(
      checkRateLimit(secondRequest, "test-ipv6", {
        limit: 1,
        windowMs: 1000,
      }),
    ).toMatchObject({ ok: false });
  });

  it("removes expired entries during scheduled cleanup", () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1_000);

    checkRateLimit(createRequest("192.0.2.8"), "test-expiry", {
      limit: 1,
      windowMs: 1000,
    });
    expect(getRateLimitStoreSize()).toBe(1);

    now.mockReturnValue(61_001);
    checkRateLimit(createRequest("192.0.2.9"), "test-expiry", {
      limit: 1,
      windowMs: 1000,
    });

    expect(getRateLimitStoreSize()).toBe(1);
  });

  it("fails closed without growing beyond the store limit", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);

    for (let index = 0; index < RATE_LIMIT_STORE_MAX_ENTRIES; index += 1) {
      const thirdOctet = Math.floor(index / 256);
      const fourthOctet = index % 256;
      const result = checkRateLimit(
        createRequest(`10.0.${thirdOctet}.${fourthOctet}`),
        "test-capacity",
        { limit: 1, windowMs: 60_000 },
      );

      expect(result.ok).toBe(true);
    }

    const overflowResult = checkRateLimit(
      createRequest("10.1.0.1"),
      "test-capacity",
      { limit: 1, windowMs: 60_000 },
    );

    expect(overflowResult).toMatchObject({ ok: false });
    expect(getRateLimitStoreSize()).toBe(RATE_LIMIT_STORE_MAX_ENTRIES);
  });
});
