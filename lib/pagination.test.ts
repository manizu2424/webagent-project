import { describe, expect, it } from "vitest";
import { getTotalPages, parsePage } from "./pagination";

describe("parsePage", () => {
  it.each([undefined, "", "0", "-1", "1.5", "invalid"])(
    "normalizes %s to the first page",
    (value) => {
      expect(parsePage(value)).toBe(1);
    },
  );

  it("accepts a positive integer from a repeated query", () => {
    expect(parsePage(["3", "4"])).toBe(3);
  });
});

describe("getTotalPages", () => {
  it("always returns at least one page", () => {
    expect(getTotalPages(0, 25)).toBe(1);
  });

  it("rounds partial pages up", () => {
    expect(getTotalPages(26, 25)).toBe(2);
  });
});
