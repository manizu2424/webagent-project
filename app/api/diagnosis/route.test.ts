import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  isDiagnosisWorkflowConfigured: vi.fn(),
  triggerDiagnosisWorkflow: vi.fn(),
  findDiagnosis: vi.fn(),
  transaction: vi.fn(),
  insert: vi.fn(),
  transactionInsert: vi.fn(),
  update: vi.fn(),
  leadValues: vi.fn(),
  diagnosisValues: vi.fn(),
  logValues: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/n8n/diagnosis", () => ({
  isDiagnosisWorkflowConfigured: mocks.isDiagnosisWorkflowConfigured,
  triggerDiagnosisWorkflow: mocks.triggerDiagnosisWorkflow,
}));

vi.mock("@/db", () => ({
  getDb: () => ({
    query: {
      diagnoses: {
        findFirst: mocks.findDiagnosis,
      },
    },
    transaction: mocks.transaction,
    insert: mocks.insert,
    update: mocks.update,
  }),
}));

import { POST } from "./route";

const lead = {
  id: "123e4567-e89b-42d3-a456-426614174001",
};
const diagnosis = {
  id: "123e4567-e89b-42d3-a456-426614174002",
  publicId: "123e4567-e89b-42d3-a456-426614174003",
  status: "SUBMITTED" as const,
};

function createRequest(includeIdempotencyKey = true) {
  const headers = new Headers({ "content-type": "application/json" });

  if (includeIdempotencyKey) {
    headers.set(
      "idempotency-key",
      "123e4567-e89b-42d3-a456-426614174010",
    );
  }

  return new Request("http://localhost/api/diagnosis", {
    method: "POST",
    headers,
    body: JSON.stringify({
      companyName: "테스트 회사",
      contactName: "테스트 담당자",
      email: "contact@example.com",
      privacyConsent: true,
      currentTools: ["Google Sheets"],
      repetitiveTasks: ["보고서 정리"],
    }),
  });
}

describe("POST /api/diagnosis workflow state", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mocks.checkRateLimit.mockReturnValue({ ok: true });
    mocks.isDiagnosisWorkflowConfigured.mockReturnValue(false);
    mocks.findDiagnosis
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue({ status: diagnosis.status });
    mocks.leadValues.mockReturnValue({
      returning: vi.fn().mockResolvedValue([lead]),
    });
    mocks.diagnosisValues.mockReturnValue({
      returning: vi.fn().mockResolvedValue([diagnosis]),
    });
    mocks.logValues.mockResolvedValue(undefined);
    mocks.transactionInsert
      .mockReturnValueOnce({ values: mocks.leadValues })
      .mockReturnValueOnce({ values: mocks.diagnosisValues });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({ insert: mocks.transactionInsert }),
    );
    mocks.insert.mockReturnValue({ values: mocks.logValues });
    mocks.updateWhere.mockResolvedValue(undefined);
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.update.mockReturnValue({ set: mocks.updateSet });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("moves the diagnosis to PROCESSING before delivery", async () => {
    mocks.isDiagnosisWorkflowConfigured.mockReturnValue(true);
    mocks.findDiagnosis
      .mockReset()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue({ status: "PROCESSING" });
    mocks.triggerDiagnosisWorkflow.mockResolvedValue({ status: "delivered" });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      publicId: diagnosis.publicId,
      status: "PROCESSING",
      n8nStatus: "delivered",
    });
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PROCESSING" }),
    );
    expect(mocks.updateSet).toHaveBeenCalledTimes(1);
    expect(mocks.updateSet.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.triggerDiagnosisWorkflow.mock.invocationCallOrder[0],
    );
    expect(mocks.transaction.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.triggerDiagnosisWorkflow.mock.invocationCallOrder[0],
    );
    const processingQuery = new PgDialect().sqlToQuery(
      mocks.updateWhere.mock.calls[0][0] as SQL,
    );
    expect(processingQuery.params).toEqual([diagnosis.id, "SUBMITTED"]);
    expect(mocks.logValues).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "delivered",
        errorMessage: undefined,
      }),
    );
  });

  it("requires a valid idempotency key", async () => {
    const response = await POST(createRequest(false));

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the public bucket is exhausted", async () => {
    mocks.checkRateLimit.mockReturnValue({
      ok: false,
      retryAfterSeconds: 45,
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("45");
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.triggerDiagnosisWorkflow).not.toHaveBeenCalled();
  });

  it("keeps the diagnosis SUBMITTED when the webhook is not configured", async () => {
    mocks.triggerDiagnosisWorkflow.mockResolvedValue({
      status: "skipped",
      reason: "not configured",
    });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      publicId: diagnosis.publicId,
      status: "SUBMITTED",
      n8nStatus: "skipped",
    });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.logValues).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "skipped",
        errorMessage: undefined,
      }),
    );
  });

  it("moves the diagnosis to FAILED and stores a safe error after retries", async () => {
    mocks.isDiagnosisWorkflowConfigured.mockReturnValue(true);
    mocks.findDiagnosis.mockResolvedValue({ status: "FAILED" });
    mocks.triggerDiagnosisWorkflow.mockRejectedValue(
      new Error(
        "request to https://secret.example/webhook?token=private failed",
      ),
    );

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      publicId: diagnosis.publicId,
      status: "FAILED",
      n8nStatus: "failed",
    });
    expect(mocks.updateSet).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ status: "FAILED" }),
    );
    const failedQuery = new PgDialect().sqlToQuery(
      mocks.updateWhere.mock.calls[1][0] as SQL,
    );
    expect(failedQuery.params).toEqual([diagnosis.id, "PROCESSING"]);
    expect(mocks.logValues).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        errorMessage: "n8n webhook delivery failed after 2 attempts.",
      }),
    );
    expect(JSON.stringify(mocks.logValues.mock.calls)).not.toContain(
      "secret.example",
    );
    expect(console.error).toHaveBeenCalledWith(
      "diagnosis.workflow_delivery_failed",
      expect.objectContaining({
        diagnosisId: diagnosis.id,
        errorType: "Error",
        requestId: expect.any(String),
      }),
    );
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "secret.example",
    );
  });

  it("returns COMPLETED when callback finishes before a successful delivery returns", async () => {
    mocks.isDiagnosisWorkflowConfigured.mockReturnValue(true);
    mocks.findDiagnosis
      .mockReset()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue({ status: "COMPLETED" });
    mocks.triggerDiagnosisWorkflow.mockResolvedValue({ status: "delivered" });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      publicId: diagnosis.publicId,
      status: "COMPLETED",
      n8nStatus: "delivered",
    });
    expect(mocks.updateSet).toHaveBeenCalledTimes(1);
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PROCESSING" }),
    );
  });

  it("preserves COMPLETED when callback finishes before delivery failure", async () => {
    mocks.isDiagnosisWorkflowConfigured.mockReturnValue(true);
    mocks.findDiagnosis
      .mockReset()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue({ status: "COMPLETED" });
    mocks.triggerDiagnosisWorkflow.mockRejectedValue(new Error("timeout"));

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      publicId: diagnosis.publicId,
      status: "COMPLETED",
      n8nStatus: "failed",
    });
    const failedQuery = new PgDialect().sqlToQuery(
      mocks.updateWhere.mock.calls[1][0] as SQL,
    );
    expect(failedQuery.params).toEqual([diagnosis.id, "PROCESSING"]);
  });

  it("returns the existing diagnosis without triggering the workflow on replay", async () => {
    const { createRequestFingerprint } = await import("@/lib/api/idempotency");
    mocks.findDiagnosis.mockReset().mockResolvedValue({
      publicId: diagnosis.publicId,
      status: "PROCESSING",
      submissionFingerprint: createRequestFingerprint({
        companyName: "테스트 회사",
        contactName: "테스트 담당자",
        email: "contact@example.com",
        privacyConsent: true,
        currentTools: ["Google Sheets"],
        repetitiveTasks: ["보고서 정리"],
      }),
    });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      publicId: diagnosis.publicId,
      status: "PROCESSING",
      n8nStatus: "replayed",
      replayed: true,
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.triggerDiagnosisWorkflow).not.toHaveBeenCalled();
  });

  it("keeps the successful response when automation log storage fails", async () => {
    mocks.logValues.mockRejectedValue(new Error("log storage unavailable"));

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.publicId).toBe(diagnosis.publicId);
    expect(console.error).toHaveBeenCalledWith(
      "diagnosis.automation_log_save_failed",
      expect.objectContaining({ diagnosisId: diagnosis.id }),
    );
  });

  it("returns the concurrently-created diagnosis after a unique-key race", async () => {
    const { createRequestFingerprint } = await import("@/lib/api/idempotency");
    mocks.findDiagnosis
      .mockReset()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue({
        publicId: diagnosis.publicId,
        status: "SUBMITTED",
        submissionFingerprint: createRequestFingerprint({
          companyName: "테스트 회사",
          contactName: "테스트 담당자",
          email: "contact@example.com",
          privacyConsent: true,
          currentTools: ["Google Sheets"],
          repetitiveTasks: ["보고서 정리"],
        }),
      });
    mocks.transaction.mockRejectedValue({
      cause: { code: "23505" },
    });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      publicId: diagnosis.publicId,
      replayed: true,
    });
    expect(mocks.triggerDiagnosisWorkflow).not.toHaveBeenCalled();
  });
});
