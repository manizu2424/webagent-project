import { DrizzleQueryError } from "drizzle-orm/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  findDiagnosis: vi.fn(),
  insert: vi.fn(),
  leadValues: vi.fn(),
  consultationValues: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/db", () => ({
  getDb: () => ({
    query: {
      diagnoses: {
        findFirst: mocks.findDiagnosis,
      },
    },
    insert: mocks.insert,
  }),
}));

import { POST } from "./route";

const lead = {
  id: "123e4567-e89b-42d3-a456-426614174001",
};
const consultation = {
  id: "123e4567-e89b-42d3-a456-426614174002",
  status: "REQUESTED" as const,
};

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/consultation", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/consultation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockReturnValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores the standalone form payload when diagnosisPublicId is blank", async () => {
    mocks.leadValues.mockReturnValue({
      returning: vi.fn().mockResolvedValue([lead]),
    });
    mocks.consultationValues.mockReturnValue({
      returning: vi.fn().mockResolvedValue([consultation]),
    });
    mocks.insert
      .mockReturnValueOnce({ values: mocks.leadValues })
      .mockReturnValueOnce({ values: mocks.consultationValues });

    const response = await POST(
      createRequest({
        diagnosisPublicId: "",
        companyName: "테스트 회사",
        contactName: "테스트 담당자",
        email: "contact@example.com",
        phone: "010-1234-5678",
        preferredDate: undefined,
        consultationType: "online",
        message: "상담을 요청합니다.",
        privacyConsent: true,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toEqual({
      consultationId: consultation.id,
      status: consultation.status,
    });
    expect(mocks.findDiagnosis).not.toHaveBeenCalled();
    expect(mocks.leadValues).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: "테스트 회사",
        contactName: "테스트 담당자",
        email: "contact@example.com",
      }),
    );
    expect(mocks.consultationValues).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: lead.id,
        diagnosisId: undefined,
      }),
    );
  });

  it("rejects a well-formed but unknown diagnosis ID", async () => {
    mocks.findDiagnosis.mockResolvedValue(undefined);

    const response = await POST(
      createRequest({
        diagnosisPublicId: "123e4567-e89b-42d3-a456-426614174099",
        privacyConsent: true,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({ ok: false, error: "Diagnosis not found." });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("does not expose query parameters when storage fails", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.insert.mockImplementationOnce(() => {
      throw new DrizzleQueryError(
        "insert into leads (email, phone) values ($1, $2)",
        ["private@example.invalid", "010-secret-number"],
        new Error("database failure"),
      );
    });

    const response = await POST(
      createRequest({
        diagnosisPublicId: "",
        companyName: "비공개 회사",
        contactName: "비공개 담당자",
        email: "private@example.invalid",
        phone: "010-secret-number",
        privacyConsent: true,
      }),
    );
    const serializedLogs = JSON.stringify(errorLog.mock.calls);

    expect(response.status).toBe(500);
    expect(response.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f-]{27}$/,
    );
    expect(serializedLogs).toContain("consultation.submission_failed");
    expect(serializedLogs).not.toContain("private@example.invalid");
    expect(serializedLogs).not.toContain("010-secret-number");
    expect(serializedLogs).not.toContain("insert into leads");
    expect(serializedLogs).not.toContain("database failure");
  });
});
