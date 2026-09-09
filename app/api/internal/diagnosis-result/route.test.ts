import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findDiagnosis: vi.fn(),
  transaction: vi.fn(),
  transactionInsert: vi.fn(),
  resultValues: vi.fn(),
  onConflictDoUpdate: vi.fn(),
  returning: vi.fn(),
  transactionUpdate: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  updateReturning: vi.fn(),
  notifyDiagnosisCompleted: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: () => ({
    query: {
      diagnoses: {
        findFirst: mocks.findDiagnosis,
      },
    },
    transaction: mocks.transaction,
  }),
}));

vi.mock("@/lib/notifications/telegram", () => ({
  notifyDiagnosisCompleted: mocks.notifyDiagnosisCompleted,
}));

import { POST } from "./route";

const originalInternalApiSecret = process.env.INTERNAL_API_SECRET;
const diagnosis = {
  id: "123e4567-e89b-42d3-a456-426614174001",
  publicId: "123e4567-e89b-42d3-a456-426614174000",
  lead: {
    companyName: "테스트 회사",
    contactName: "홍길동",
    email: "contact@example.com",
  },
};
const validResult = {
  diagnosisPublicId: diagnosis.publicId,
  automationScore: 82,
  recommendedTasks: [
    {
      name: "보고서 자동화",
      reason: "반복 작성 시간이 큽니다.",
      difficulty: "LOW",
      estimatedMonthlySavedHours: 12,
    },
  ],
  estimatedSavedHoursMin: 10,
  estimatedSavedHoursMax: 20,
  difficulty: "LOW",
  recommendedStack: ["n8n", "PostgreSQL"],
  implementationSteps: [
    {
      order: 1,
      title: "데이터 연결",
      description: "입력 데이터를 워크플로에 연결합니다.",
    },
  ],
  aiSummary: "보고서 업무부터 자동화하는 것이 효과적입니다.",
  modelName: "test-model",
};

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/internal/diagnosis-result", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-api-secret": "test-secret",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/internal/diagnosis-result", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.INTERNAL_API_SECRET = "test-secret";
    mocks.findDiagnosis.mockResolvedValue(diagnosis);
    mocks.returning.mockResolvedValue([
      { id: "123e4567-e89b-42d3-a456-426614174002" },
    ]);
    mocks.onConflictDoUpdate.mockReturnValue({ returning: mocks.returning });
    mocks.resultValues.mockReturnValue({
      onConflictDoUpdate: mocks.onConflictDoUpdate,
    });
    mocks.transactionInsert.mockReturnValue({ values: mocks.resultValues });
    mocks.updateReturning.mockResolvedValue([{ id: diagnosis.id }]);
    mocks.updateWhere.mockReturnValue({ returning: mocks.updateReturning });
    mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
    mocks.transactionUpdate.mockReturnValue({ set: mocks.updateSet });
    mocks.notifyDiagnosisCompleted.mockResolvedValue({ status: "sent" });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        insert: mocks.transactionInsert,
        update: mocks.transactionUpdate,
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalInternalApiSecret === undefined) {
      delete process.env.INTERNAL_API_SECRET;
    } else {
      process.env.INTERNAL_API_SECRET = originalInternalApiSecret;
    }
  });

  it("rejects an invalid numeric payload with 422 before database access", async () => {
    const response = await POST(
      createRequest({ ...validResult, automationScore: null }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({
      ok: false,
      error: "Invalid diagnosis result payload.",
    });
    expect(mocks.findDiagnosis).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects duplicate implementation step orders with 422", async () => {
    const response = await POST(
      createRequest({
        ...validResult,
        implementationSteps: [
          {
            order: 2,
            title: "첫 단계",
            description: "잘못된 순서입니다.",
          },
          {
            order: 2,
            title: "둘째 단계",
            description: "순서가 중복됩니다.",
          },
        ],
      }),
    );

    expect(response.status).toBe(422);
    expect(mocks.findDiagnosis).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("stores a valid result and completes the diagnosis", async () => {
    const response = await POST(createRequest(validResult));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        resultId: "123e4567-e89b-42d3-a456-426614174002",
        diagnosisPublicId: diagnosis.publicId,
        status: "COMPLETED",
      },
    });
    expect(mocks.resultValues).toHaveBeenCalledWith(
      expect.objectContaining({
        diagnosisId: diagnosis.id,
        automationScore: validResult.automationScore,
        estimatedSavedHoursMin: "10",
        estimatedSavedHoursMax: "20",
        rawAiResult: validResult,
      }),
    );
    expect(mocks.onConflictDoUpdate).toHaveBeenCalled();
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "COMPLETED" }),
    );
    const completionQuery = new PgDialect().sqlToQuery(
      mocks.updateWhere.mock.calls[0][0] as SQL,
    );
    expect(completionQuery.params).toEqual([diagnosis.id, "COMPLETED"]);
    expect(mocks.notifyDiagnosisCompleted).toHaveBeenCalledWith({
      publicId: diagnosis.publicId,
      companyName: diagnosis.lead.companyName,
      contactName: diagnosis.lead.contactName,
      email: diagnosis.lead.email,
      automationScore: validResult.automationScore,
    });
    expect(mocks.transaction.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.notifyDiagnosisCompleted.mock.invocationCallOrder[0],
    );
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("does not notify again when a duplicate callback updates the result", async () => {
    mocks.updateReturning.mockResolvedValue([]);

    const response = await POST(createRequest(validResult));

    expect(response.status).toBe(200);
    expect(mocks.resultValues).toHaveBeenCalled();
    expect(mocks.notifyDiagnosisCompleted).not.toHaveBeenCalled();
  });

  it("keeps a successful callback response when notification delivery fails", async () => {
    const errorLog = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.notifyDiagnosisCompleted.mockRejectedValue(
      new Error("https://api.telegram.org/botprivate-token/sendMessage"),
    );

    const response = await POST(createRequest(validResult));
    const serializedLogs = JSON.stringify(errorLog.mock.calls);

    expect(response.status).toBe(200);
    expect(serializedLogs).toContain(
      "telegram.diagnosis_notification_failed",
    );
    expect(serializedLogs).not.toContain("private-token");
  });
});
