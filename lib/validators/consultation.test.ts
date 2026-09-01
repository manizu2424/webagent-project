import { describe, expect, it } from "vitest";
import { consultationSubmissionSchema } from "./consultation";

describe("consultationSubmissionSchema", () => {
  it("accepts a consultation linked to a diagnosis", () => {
    const result = consultationSubmissionSchema.safeParse({
      diagnosisPublicId: "306ad6d3-bfbc-4ad5-b934-455c7cffb1f5",
      consultationType: "online",
      message: "상담 요청",
      privacyConsent: true,
    });

    expect(result.success).toBe(true);
  });

  it("accepts a standalone consultation with contact fields", () => {
    const result = consultationSubmissionSchema.safeParse({
      companyName: "테스트 회사",
      contactName: "테스트 담당자",
      email: "contact@example.com",
      privacyConsent: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty consultation request", () => {
    const result = consultationSubmissionSchema.safeParse({
      message: "연락주세요",
      privacyConsent: true,
    });

    expect(result.success).toBe(false);
  });

  it("requires privacy consent", () => {
    const result = consultationSubmissionSchema.safeParse({
      diagnosisPublicId: "306ad6d3-bfbc-4ad5-b934-455c7cffb1f5",
      privacyConsent: false,
    });

    expect(result.success).toBe(false);
  });
});
