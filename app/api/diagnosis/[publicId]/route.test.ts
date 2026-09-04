import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirstMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: () => ({
    query: {
      diagnoses: {
        findFirst: findFirstMock,
      },
    },
  }),
}));

import { GET } from "./route";

const publicId = "123e4567-e89b-42d3-a456-426614174000";

function callRoute(value = publicId) {
  return GET(new Request(`http://localhost/api/diagnosis/${value}`), {
    params: Promise.resolve({ publicId: value }),
  });
}

describe("GET /api/diagnosis/[publicId]", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
  });

  it("returns only fields approved for the public result page", async () => {
    findFirstMock.mockResolvedValue({
      id: "private-diagnosis-id",
      leadId: "private-lead-id",
      publicId,
      status: "COMPLETED",
      painPoint: "수작업 보고서 작성",
      repetitiveTasks: ["보고서 정리"],
      rawAnswers: { privateAnswer: true },
      lead: {
        id: "private-lead-id",
        companyName: "테스트 회사",
        contactName: "비공개 담당자",
        email: "private@example.com",
        phone: "010-0000-0000",
      },
      result: {
        id: "private-result-id",
        automationScore: 85,
        recommendedTasks: [{ title: "보고서 자동화" }],
        estimatedSavedHoursMin: "10.00",
        estimatedSavedHoursMax: "20.00",
        difficulty: "MEDIUM",
        recommendedStack: ["n8n"],
        implementationSteps: [{ order: 1, title: "연결" }],
        aiSummary: "자동화 가능성이 높습니다.",
        rawAiResult: { privatePrompt: true },
        modelName: "private-model",
      },
    });

    const response = await callRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        diagnosis: {
          publicId,
          status: "COMPLETED",
          painPoint: "수작업 보고서 작성",
          repetitiveTasks: ["보고서 정리"],
          lead: {
            companyName: "테스트 회사",
          },
          result: {
            automationScore: 85,
            recommendedTasks: [{ title: "보고서 자동화" }],
            estimatedSavedHoursMin: "10.00",
            estimatedSavedHoursMax: "20.00",
            difficulty: "MEDIUM",
            recommendedStack: ["n8n"],
            implementationSteps: [{ order: 1, title: "연결" }],
            aiSummary: "자동화 가능성이 높습니다.",
          },
        },
      },
    });

    const serializedBody = JSON.stringify(body);
    expect(serializedBody).not.toContain("private@example.com");
    expect(serializedBody).not.toContain("010-0000-0000");
    expect(serializedBody).not.toContain("비공개 담당자");
    expect(serializedBody).not.toContain("private-diagnosis-id");
    expect(serializedBody).not.toContain("private-lead-id");
    expect(serializedBody).not.toContain("private-result-id");
    expect(serializedBody).not.toContain("privatePrompt");
    expect(serializedBody).not.toContain("private-model");
  });

  it("rejects an invalid public id before querying the database", async () => {
    const response = await callRoute("not-a-uuid");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Invalid diagnosis public id.",
    });
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the diagnosis does not exist", async () => {
    findFirstMock.mockResolvedValue(undefined);

    const response = await callRoute();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "Diagnosis not found.",
    });
  });
});
