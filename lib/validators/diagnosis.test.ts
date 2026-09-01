import { describe, expect, it } from "vitest";
import { diagnosisSubmissionSchema } from "./diagnosis";

const validSubmission = {
  companyName: "테스트 회사",
  contactName: "테스트 담당자",
  email: "contact@example.com",
  privacyConsent: true,
  currentTools: ["Google Sheets"],
  repetitiveTasks: ["보고서 정리"],
  dailyHours: 2,
  monthlyVolume: 30,
};

describe("diagnosisSubmissionSchema", () => {
  it("accepts a valid diagnosis submission", () => {
    const result = diagnosisSubmissionSchema.safeParse(validSubmission);

    expect(result.success).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    const result = diagnosisSubmissionSchema.safeParse({
      ...validSubmission,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  it("rejects daily hours above 24", () => {
    const result = diagnosisSubmissionSchema.safeParse({
      ...validSubmission,
      dailyHours: 25,
    });

    expect(result.success).toBe(false);
  });

  it("requires privacy consent", () => {
    const result = diagnosisSubmissionSchema.safeParse({
      ...validSubmission,
      privacyConsent: false,
    });

    expect(result.success).toBe(false);
  });
});
