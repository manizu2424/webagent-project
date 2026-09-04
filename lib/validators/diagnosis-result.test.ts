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
});
