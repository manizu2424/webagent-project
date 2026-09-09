import { DrizzleQueryError } from "drizzle-orm/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  findDiagnosis: vi.fn(),
  findConsultation: vi.fn(),
  transaction: vi.fn(),
  transactionInsert: vi.fn(),
  leadValues: vi.fn(),
  consultationValues: vi.fn(),
  notifyConsultationRequested: vi.fn(),
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
      consultations: {
        findFirst: mocks.findConsultation,
      },
    },
    transaction: mocks.transaction,
  }),
}));

vi.mock("@/lib/notifications/telegram", () => ({
  notifyConsultationRequested: mocks.notifyConsultationRequested,
}));

import { POST } from "./route";

const lead = {
  id: "123e4567-e89b-42d3-a456-426614174001",
  companyName: "테스트 회사",
  contactName: "테스트 담당자",
  email: "contact@example.com",
};
const consultation = {
  id: "123e4567-e89b-42d3-a456-426614174002",
  status: "REQUESTED" as const,
};

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/consultation", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "123e4567-e89b-42d3-a456-426614174020",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/consultation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.checkRateLimit.mockReturnValue({ ok: true });
    mocks.findConsultation.mockResolvedValue(undefined);
    mocks.notifyConsultationRequested.mockResolvedValue({ status: "sent" });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        query: { diagnoses: { findFirst: mocks.findDiagnosis } },
        insert: mocks.transactionInsert,
      }),
    );
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
    mocks.transactionInsert
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
      contactSource: "submission",
    });
    expect(mocks.findDiagnosis).not.toHaveBeenCalled();
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
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
    expect(mocks.notifyConsultationRequested).toHaveBeenCalledWith({
      consultationId: consultation.id,
      diagnosisPublicId: undefined,
      companyName: "테스트 회사",
      contactName: "테스트 담당자",
      email: "contact@example.com",
      consultationType: "online",
    });
    expect(mocks.transaction.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.notifyConsultationRequested.mock.invocationCallOrder[0],
    );
  });

  it("uses the existing lead when a diagnosis is linked", async () => {
    const diagnosis = {
      id: "123e4567-e89b-42d3-a456-426614174003",
      leadId: lead.id,
      lead,
    };
    mocks.findDiagnosis.mockResolvedValue(diagnosis);
    mocks.consultationValues.mockReturnValue({
      returning: vi.fn().mockResolvedValue([consultation]),
    });
    mocks.transactionInsert.mockReturnValue({
      values: mocks.consultationValues,
    });

    const response = await POST(
      createRequest({
        diagnosisPublicId: "123e4567-e89b-42d3-a456-426614174099",
        companyName: "무시하지 않고 기존 리드를 사용하는 정책",
        email: "new@example.com",
        privacyConsent: true,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toEqual({
      consultationId: consultation.id,
      status: consultation.status,
      contactSource: "diagnosis",
    });
    expect(mocks.transactionInsert).toHaveBeenCalledTimes(1);
    expect(mocks.consultationValues).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: lead.id,
        diagnosisId: diagnosis.id,
      }),
    );
    expect(mocks.notifyConsultationRequested).toHaveBeenCalledWith(
      expect.objectContaining({
        diagnosisPublicId: "123e4567-e89b-42d3-a456-426614174099",
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
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
    expect(mocks.transactionInsert).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the public bucket is exhausted", async () => {
    mocks.checkRateLimit.mockReturnValue({
      ok: false,
      retryAfterSeconds: 45,
    });

    const response = await POST(
      createRequest({
        companyName: "테스트 회사",
        contactName: "테스트 담당자",
        email: "contact@example.com",
        privacyConsent: true,
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("45");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not expose query parameters when storage fails", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.transactionInsert.mockImplementationOnce(() => {
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

  it("returns an existing consultation for the same request key", async () => {
    const { createRequestFingerprint } = await import("@/lib/api/idempotency");
    const requestBody = {
      diagnosisPublicId: "",
      companyName: "테스트 회사",
      contactName: "테스트 담당자",
      email: "contact@example.com",
      privacyConsent: true,
    };
    mocks.findConsultation.mockResolvedValue({
      ...consultation,
      diagnosisId: null,
      submissionFingerprint: createRequestFingerprint({
        companyName: requestBody.companyName,
        contactName: requestBody.contactName,
        email: requestBody.email,
        privacyConsent: true,
      }),
    });

    const response = await POST(createRequest(requestBody));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      consultationId: consultation.id,
      status: consultation.status,
      contactSource: "submission",
      replayed: true,
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.notifyConsultationRequested).not.toHaveBeenCalled();
  });

  it("rejects reuse of a request key with different content", async () => {
    mocks.findConsultation.mockResolvedValue({
      ...consultation,
      submissionFingerprint: "different-fingerprint",
    });

    const response = await POST(
      createRequest({
        companyName: "테스트 회사",
        contactName: "테스트 담당자",
        email: "contact@example.com",
        privacyConsent: true,
      }),
    );

    expect(response.status).toBe(409);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("keeps a successful response when Telegram delivery fails", async () => {
    const errorLog = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.leadValues.mockReturnValue({
      returning: vi.fn().mockResolvedValue([lead]),
    });
    mocks.consultationValues.mockReturnValue({
      returning: vi.fn().mockResolvedValue([consultation]),
    });
    mocks.transactionInsert
      .mockReturnValueOnce({ values: mocks.leadValues })
      .mockReturnValueOnce({ values: mocks.consultationValues });
    mocks.notifyConsultationRequested.mockRejectedValue(
      new Error("https://api.telegram.org/botprivate-token/sendMessage"),
    );

    const response = await POST(
      createRequest({
        companyName: "테스트 회사",
        contactName: "테스트 담당자",
        email: "contact@example.com",
        privacyConsent: true,
      }),
    );
    const serializedLogs = JSON.stringify(errorLog.mock.calls);

    expect(response.status).toBe(201);
    expect(serializedLogs).toContain(
      "telegram.consultation_notification_failed",
    );
    expect(serializedLogs).not.toContain("private-token");
  });
});
