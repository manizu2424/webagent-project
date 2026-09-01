import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows requests within the limit", () => {
    const request = new Request("http://localhost/api", {
      headers: {
        "x-real-ip": "rate-test-allowed",
      },
    });

    expect(checkRateLimit(request, "test-allowed", { limit: 2, windowMs: 1000 }))
      .toMatchObject({ ok: true });
    expect(checkRateLimit(request, "test-allowed", { limit: 2, windowMs: 1000 }))
      .toMatchObject({ ok: true });
  });

  it("blocks requests over the limit", () => {
    const request = new Request("http://localhost/api", {
      headers: {
        "x-real-ip": "rate-test-blocked",
      },
    });

    checkRateLimit(request, "test-blocked", { limit: 1, windowMs: 1000 });

    expect(checkRateLimit(request, "test-blocked", { limit: 1, windowMs: 1000 }))
      .toMatchObject({ ok: false });
  });
});
