import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyInternalApiSecret } from "./internal-secret";

const originalSecret = process.env.INTERNAL_API_SECRET;

describe("verifyInternalApiSecret", () => {
  beforeEach(() => {
    process.env.INTERNAL_API_SECRET = "test-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.INTERNAL_API_SECRET;
    } else {
      process.env.INTERNAL_API_SECRET = originalSecret;
    }
  });

  it("accepts the x-internal-api-secret header", () => {
    const request = new Request("http://localhost/api/internal", {
      headers: {
        "x-internal-api-secret": "test-secret",
      },
    });

    expect(verifyInternalApiSecret(request)).toEqual({ ok: true });
  });

  it("accepts a bearer token", () => {
    const request = new Request("http://localhost/api/internal", {
      headers: {
        authorization: "Bearer test-secret",
      },
    });

    expect(verifyInternalApiSecret(request)).toEqual({ ok: true });
  });

  it("rejects invalid secrets", () => {
    const request = new Request("http://localhost/api/internal", {
      headers: {
        "x-internal-api-secret": "wrong",
      },
    });

    expect(verifyInternalApiSecret(request)).toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("fails closed when the secret is not configured", () => {
    delete process.env.INTERNAL_API_SECRET;

    const request = new Request("http://localhost/api/internal");

    expect(verifyInternalApiSecret(request)).toMatchObject({
      ok: false,
      status: 503,
    });
  });
});
