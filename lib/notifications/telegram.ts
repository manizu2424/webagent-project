const TELEGRAM_API_BASE_URL = "https://api.telegram.org";
const TELEGRAM_REQUEST_TIMEOUT_MS = 5_000;

type NotificationContact = {
  companyName: string;
  contactName: string;
  email: string;
};

type DiagnosisCompletedNotification = NotificationContact & {
  publicId: string;
  automationScore: number;
};

type ConsultationRequestedNotification = NotificationContact & {
  consultationId: string;
  consultationType?: string;
  diagnosisPublicId?: string;
};

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return "http://localhost:3000";
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return "http://localhost:3000";
  }
}

function createSiteUrl(path: string) {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

export function isTelegramConfigured() {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN?.trim() &&
      process.env.TELEGRAM_CHAT_ID?.trim(),
  );
}

export async function sendTelegramMessage(text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    return { status: "skipped" } as const;
  }

  const response = await fetch(
    `${TELEGRAM_API_BASE_URL}/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(TELEGRAM_REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    const error = new Error("Telegram notification delivery failed.");
    Object.assign(error, { code: `TELEGRAM_HTTP_${response.status}` });
    throw error;
  }

  return { status: "sent" } as const;
}

export function notifyDiagnosisCompleted(
  notification: DiagnosisCompletedNotification,
) {
  const resultUrl = createSiteUrl(
    `/diagnosis/result/${notification.publicId}`,
  );

  return sendTelegramMessage(
    [
      "✅ AI 진단 완료",
      `회사명: ${notification.companyName}`,
      `담당자: ${notification.contactName}`,
      `이메일: ${notification.email}`,
      `자동화 점수: ${notification.automationScore}/100`,
      `진단 결과: ${resultUrl}`,
    ].join("\n"),
  );
}

export function notifyConsultationRequested(
  notification: ConsultationRequestedNotification,
) {
  const adminUrl = createSiteUrl(
    `/admin/consultations/${notification.consultationId}`,
  );
  const lines = [
    "📩 새 상담 신청",
    `회사명: ${notification.companyName}`,
    `담당자: ${notification.contactName}`,
    `이메일: ${notification.email}`,
  ];

  if (notification.consultationType) {
    lines.push(`상담 방식: ${notification.consultationType}`);
  }

  if (notification.diagnosisPublicId) {
    lines.push(
      `진단 결과: ${createSiteUrl(`/diagnosis/result/${notification.diagnosisPublicId}`)}`,
    );
  }

  lines.push(`관리자 확인: ${adminUrl}`);

  return sendTelegramMessage(lines.join("\n"));
}
