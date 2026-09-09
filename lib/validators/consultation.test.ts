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

  it("normalizes contact overrides when a diagnosis is linked", () => {
    const result = consultationSubmissionSchema.safeParse({
      diagnosisPublicId: "306ad6d3-bfbc-4ad5-b934-455c7cffb1f5",
      companyName: "새 회사명",
      contactName: "새 담당자",
      email: "new@example.com",
      phone: "010-0000-0000",
      privacyConsent: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        companyName: undefined,
        contactName: undefined,
        email: undefined,
        phone: undefined,
      });
    }
  });

  it("accepts a standalone consultation with contact fields", () => {
    const result = consultationSubmissionSchema.safeParse({
      diagnosisPublicId: "",
      companyName: "테스트 회사",
      contactName: "테스트 담당자",
      email: "contact@example.com",
      phone: "",
      preferredDate: undefined,
      consultationType: "online",
      message: "",
      privacyConsent: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.diagnosisPublicId).toBeUndefined();
    }
  });

  it("normalizes a whitespace-only diagnosis ID for a standalone consultation", () => {
    const result = consultationSubmissionSchema.safeParse({
      diagnosisPublicId: "   ",
      companyName: "테스트 회사",
      contactName: "테스트 담당자",
      email: "contact@example.com",
      privacyConsent: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.diagnosisPublicId).toBeUndefined();
    }
  });

  it("rejects a non-empty invalid diagnosis ID", () => {
    const result = consultationSubmissionSchema.safeParse({
      diagnosisPublicId: "not-a-uuid",
      companyName: "테스트 회사",
      contactName: "테스트 담당자",
      email: "contact@example.com",
      privacyConsent: true,
    });

    expect(result.success).toBe(false);
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
