import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isTelegramConfigured,
  notifyConsultationRequested,
  notifyDiagnosisCompleted,
  sendTelegramMessage,
} from "./telegram";

const originalEnvironment = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};

describe("Telegram notifications", () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
    process.env.TELEGRAM_CHAT_ID = "-1001234567890";
    process.env.NEXT_PUBLIC_SITE_URL = "https://webagent.kr";
  });

  afterEach(() => {
    vi.restoreAllMocks();

    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("skips delivery when Telegram credentials are missing", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const fetchMock = vi.spyOn(globalThis, "fetch");

    expect(isTelegramConfigured()).toBe(false);
    await expect(sendTelegramMessage("test")).resolves.toEqual({
      status: "skipped",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a diagnosis completion message with contact and result details", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await expect(
      notifyDiagnosisCompleted({
        publicId: "123e4567-e89b-42d3-a456-426614174000",
        companyName: "테스트 회사",
        contactName: "홍길동",
        email: "contact@example.com",
        automationScore: 82,
      }),
    ).resolves.toEqual({ status: "sent" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request?.body?.toString() ?? "{}");

    expect(url.toString()).toBe(
      "https://api.telegram.org/bottest-bot-token/sendMessage",
    );
    expect(body).toMatchObject({
      chat_id: "-1001234567890",
      disable_web_page_preview: true,
    });
    expect(body.text).toContain("AI 진단 완료");
    expect(body.text).toContain("테스트 회사");
    expect(body.text).toContain("홍길동");
    expect(body.text).toContain("contact@example.com");
    expect(body.text).toContain("자동화 점수: 82/100");
    expect(body.text).toContain(
      "https://webagent.kr/diagnosis/result/123e4567-e89b-42d3-a456-426614174000",
    );
  });

  it("sends a consultation message with admin and linked diagnosis URLs", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await notifyConsultationRequested({
      consultationId: "123e4567-e89b-42d3-a456-426614174010",
      diagnosisPublicId: "123e4567-e89b-42d3-a456-426614174000",
      companyName: "테스트 회사",
      contactName: "홍길동",
      email: "contact@example.com",
      consultationType: "online",
    });

    const body = JSON.parse(
      fetchMock.mock.calls[0][1]?.body?.toString() ?? "{}",
    );
    expect(body.text).toContain("새 상담 신청");
    expect(body.text).toContain("상담 방식: online");
    expect(body.text).toContain(
      "https://webagent.kr/admin/consultations/123e4567-e89b-42d3-a456-426614174010",
    );
    expect(body.text).toContain(
      "https://webagent.kr/diagnosis/result/123e4567-e89b-42d3-a456-426614174000",
    );
  });

  it("throws a generic error without exposing the Telegram response body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("private Telegram error details", { status: 502 }),
    );

    await expect(sendTelegramMessage("test")).rejects.toMatchObject({
      message: "Telegram notification delivery failed.",
      code: "TELEGRAM_HTTP_502",
    });
  });
});
