import { describe, expect, it } from "vitest";
import { shouldPollDiagnosis } from "./status";

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
