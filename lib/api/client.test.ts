import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "./client";

describe("requestJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns a parsed JSON response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ ok: true, data: { saved: true } }),
    );

    const result = await requestJson<{ ok: true }>("/api/example");

    expect(result.response.ok).toBe(true);
    expect(result.data).toMatchObject({ ok: true });
  });

  it("retries a network failure up to the configured limit", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("network failed"))
      .mockResolvedValueOnce(Response.json({ ok: true }));

    const result = await requestJson<{ ok: true }>(
      "/api/example",
      {},
      { retries: 1 },
    );

    expect(result.data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects non-JSON responses with a safe error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("upstream details", { status: 502 }),
    );

    await expect(requestJson("/api/example")).rejects.toMatchObject({
      kind: "invalid-response",
      message: expect.not.stringContaining("upstream details"),
    });
  });

  it("aborts a request after its timeout", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );

    const request = requestJson("/api/example", {}, { timeoutMs: 100 });
    const expectation = expect(request).rejects.toEqual(
      expect.objectContaining({ kind: "timeout" }),
    );
    await vi.advanceTimersByTimeAsync(100);

    await expectation;
  });

  it("does not start a request when the caller signal is already aborted", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const controller = new AbortController();
    controller.abort();

    await expect(
      requestJson("/api/example", { signal: controller.signal }),
    ).rejects.toMatchObject({ kind: "aborted" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
