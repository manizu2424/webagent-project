import type { DiagnosisStatus } from "@/lib/constants/status";

export const DIAGNOSIS_POLL_INTERVAL_MS = 5_000;
export const DIAGNOSIS_MAX_POLL_DURATION_MS = 2 * 60_000;

export function shouldPollDiagnosis(status: DiagnosisStatus) {
  return status === "PROCESSING";
}

export function getDiagnosisPollingDecision(
  status: DiagnosisStatus,
  elapsedMs: number,
) {
  if (!shouldPollDiagnosis(status)) {
    return "stop" as const;
  }

  if (elapsedMs >= DIAGNOSIS_MAX_POLL_DURATION_MS) {
    return "long-wait" as const;
  }

  return "poll" as const;
}

export function getDiagnosisStatusMessage(
  status: DiagnosisStatus,
  hasWaitedTooLong = false,
) {
  switch (status) {
    case "SUBMITTED":
      return {
        title: "진단이 접수되었습니다.",
        description:
          "자동 분석 연결이 설정되지 않아 담당자가 제출 내용을 확인한 뒤 안내드릴 예정입니다.",
      };
    case "PROCESSING":
      return hasWaitedTooLong
        ? {
            title: "분석이 평소보다 오래 걸리고 있습니다.",
            description:
              "자동 확인을 잠시 멈췄습니다. 제출 내용은 저장되어 있으며 잠시 후 다시 확인할 수 있습니다.",
          }
        : {
            title: "AI 분석을 기다리고 있습니다.",
            description:
              "n8n과 AI 분석 결과가 들어오면 이 화면이 자동으로 갱신됩니다.",
          };
    case "COMPLETED":
      return {
        title: "AI 분석이 완료되었습니다.",
        description: "입력한 업무를 기준으로 우선순위와 기대 효과를 정리했습니다.",
      };
    case "FAILED":
      return {
        title: "분석에 실패했습니다.",
        description:
          "담당자가 제출 내용을 확인한 뒤 다시 연락드릴 수 있습니다.",
      };
  }
}
