import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  resetRateLimit: vi.fn(),
  isAdminAuthConfigured: vi.fn(),
  setAdminSession: vi.fn(),
  verifyAdminCredentials: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  resetRateLimit: mocks.resetRateLimit,
}));

vi.mock("@/lib/auth/admin", () => ({
  isAdminAuthConfigured: mocks.isAdminAuthConfigured,
  setAdminSession: mocks.setAdminSession,
  verifyAdminCredentials: mocks.verifyAdminCredentials,
}));

import { POST } from "./route";

function createRequest(password = "valid-password") {
  return new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": "admin-login-test",
    },
    body: JSON.stringify({ email: "admin@example.com", password }),
  });
}

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockReturnValue({ ok: true });
    mocks.isAdminAuthConfigured.mockReturnValue(true);
    mocks.verifyAdminCredentials.mockResolvedValue(true);
    mocks.setAdminSession.mockResolvedValue(undefined);
  });

  it("creates a session and resets the login bucket", async () => {
    const request = createRequest();
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.verifyAdminCredentials).toHaveBeenCalledWith(
      "admin@example.com",
      "valid-password",
    );
    expect(mocks.setAdminSession).toHaveBeenCalledWith("admin@example.com");
    expect(mocks.resetRateLimit).toHaveBeenCalledWith(request, "admin-login");
  });

  it("rejects invalid credentials without resetting the bucket", async () => {
    mocks.verifyAdminCredentials.mockResolvedValue(false);

    const response = await POST(createRequest("wrong-password"));

    expect(response.status).toBe(401);
    expect(mocks.setAdminSession).not.toHaveBeenCalled();
    expect(mocks.resetRateLimit).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the login bucket is exhausted", async () => {
    mocks.checkRateLimit.mockReturnValue({
      ok: false,
      retryAfterSeconds: 321,
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("321");
    expect(mocks.verifyAdminCredentials).not.toHaveBeenCalled();
  });

  it("rejects a legacy or missing password hash configuration", async () => {
    mocks.isAdminAuthConfigured.mockReturnValue(false);

    const response = await POST(createRequest());

    expect(response.status).toBe(503);
    expect(mocks.verifyAdminCredentials).not.toHaveBeenCalled();
  });
});
