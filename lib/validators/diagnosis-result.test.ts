import { describe, expect, it } from "vitest";
import { diagnosisResultSubmissionSchema } from "./diagnosis-result";

const validResult = {
  diagnosisPublicId: "123e4567-e89b-42d3-a456-426614174000",
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

describe("diagnosisResultSubmissionSchema", () => {
  it("accepts a complete structured result", () => {
    expect(diagnosisResultSubmissionSchema.safeParse(validResult).success).toBe(
      true,
    );
  });

  it("rejects a minimum estimate greater than the maximum", () => {
    const result = diagnosisResultSubmissionSchema.safeParse({
      ...validResult,
      estimatedSavedHoursMin: 30,
      estimatedSavedHoursMax: 20,
    });

    expect(result.success).toBe(false);
  });

  it("rejects unsupported difficulty values", () => {
    const result = diagnosisResultSubmissionSchema.safeParse({
      ...validResult,
      difficulty: "VERY_EASY",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown root fields instead of storing unvalidated AI output", () => {
    const result = diagnosisResultSubmissionSchema.safeParse({
      ...validResult,
      rawPrompt: "private prompt",
    });

    expect(result.success).toBe(false);
  });

  it("limits result collection sizes", () => {
    const result = diagnosisResultSubmissionSchema.safeParse({
      ...validResult,
      recommendedTasks: Array.from({ length: 6 }, (_, index) => ({
        name: `업무 ${index + 1}`,
        reason: "반복 업무입니다.",
        difficulty: "LOW",
        estimatedMonthlySavedHours: 1,
      })),
    });

    expect(result.success).toBe(false);
  });

  it.each([null, "", true, false])(
    "rejects non-number AI values instead of coercing %j",
    (invalidNumber) => {
      const payloads = [
        { ...validResult, automationScore: invalidNumber },
        {
          ...validResult,
          recommendedTasks: [
            {
              ...validResult.recommendedTasks[0],
              estimatedMonthlySavedHours: invalidNumber,
            },
          ],
        },
        { ...validResult, estimatedSavedHoursMin: invalidNumber },
        { ...validResult, estimatedSavedHoursMax: invalidNumber },
        {
          ...validResult,
          implementationSteps: [
            { ...validResult.implementationSteps[0], order: invalidNumber },
          ],
        },
      ];

      for (const payload of payloads) {
        expect(diagnosisResultSubmissionSchema.safeParse(payload).success).toBe(
          false,
        );
      }
    },
  );

  it.each([
    ["does not start at 1", [2, 3]],
    ["contains duplicate orders", [1, 2, 2]],
    ["contains a gap", [1, 3]],
    ["is out of array order", [2, 1]],
  ])("rejects implementation steps when the order %s", (_, orders) => {
    const result = diagnosisResultSubmissionSchema.safeParse({
      ...validResult,
      implementationSteps: orders.map((order) => ({
        order,
        title: `구현 단계 ${order}`,
        description: "순서 검증 대상입니다.",
      })),
    });

    expect(result.success).toBe(false);
  });

  it("accepts implementation steps ordered consecutively from 1", () => {
    const result = diagnosisResultSubmissionSchema.safeParse({
      ...validResult,
      implementationSteps: [1, 2, 3].map((order) => ({
        order,
        title: `구현 단계 ${order}`,
        description: "순서대로 실행합니다.",
      })),
    });

    expect(result.success).toBe(true);
  });
});
