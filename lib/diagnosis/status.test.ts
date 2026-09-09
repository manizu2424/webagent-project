import { describe, expect, it } from "vitest";
import {
  DIAGNOSIS_MAX_POLL_DURATION_MS,
  getDiagnosisPollingDecision,
  getDiagnosisStatusMessage,
  shouldPollDiagnosis,
} from "./status";

describe("shouldPollDiagnosis", () => {
  it.each([
    ["SUBMITTED", false],
    ["PROCESSING", true],
    ["COMPLETED", false],
    ["FAILED", false],
  ] as const)("returns %s polling state", (status, expected) => {
    expect(shouldPollDiagnosis(status)).toBe(expected);
  });
});

describe("getDiagnosisPollingDecision", () => {
  it("continues polling before the maximum wait", () => {
    expect(
      getDiagnosisPollingDecision(
        "PROCESSING",
        DIAGNOSIS_MAX_POLL_DURATION_MS - 1,
      ),
    ).toBe("poll");
  });

  it("stops automatic polling at the maximum wait", () => {
    expect(
      getDiagnosisPollingDecision(
        "PROCESSING",
        DIAGNOSIS_MAX_POLL_DURATION_MS,
      ),
    ).toBe("long-wait");
  });

  it("does not poll terminal or unconfigured states", () => {
    expect(getDiagnosisPollingDecision("COMPLETED", 0)).toBe("stop");
    expect(getDiagnosisPollingDecision("FAILED", 0)).toBe("stop");
    expect(getDiagnosisPollingDecision("SUBMITTED", 0)).toBe("stop");
  });
});

describe("getDiagnosisStatusMessage", () => {
  it.each([
    ["SUBMITTED", "진단이 접수되었습니다."],
    ["PROCESSING", "AI 분석을 기다리고 있습니다."],
    ["COMPLETED", "AI 분석이 완료되었습니다."],
    ["FAILED", "분석에 실패했습니다."],
  ] as const)("returns the %s UI message", (status, title) => {
    expect(getDiagnosisStatusMessage(status)).toMatchObject({ title });
  });

  it("returns the long-wait PROCESSING UI message", () => {
    expect(getDiagnosisStatusMessage("PROCESSING", true)).toMatchObject({
      title: "분석이 평소보다 오래 걸리고 있습니다.",
    });
  });
});
