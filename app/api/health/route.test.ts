import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkDatabaseConnectionMock } = vi.hoisted(() => ({
  checkDatabaseConnectionMock: vi.fn(),
}));

vi.mock("@/db", () => ({
  checkDatabaseConnection: checkDatabaseConnectionMock,
}));

import { GET } from "./route";

describe("GET /api/health", () => {
  beforeEach(() => {
    checkDatabaseConnectionMock.mockReset();
  });

  it("returns a healthy response when the database is reachable", async () => {
    checkDatabaseConnectionMock.mockResolvedValue(undefined);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      data: {
        status: "healthy",
        database: "connected",
      },
    });
  });

  it("returns a 503 response when the database check fails", async () => {
    checkDatabaseConnectionMock.mockRejectedValue(new Error("db unavailable"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      ok: false,
      error: "Health check failed.",
    });
  });
});
