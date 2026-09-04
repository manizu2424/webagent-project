import type { DiagnosisStatus } from "@/lib/constants/status";

export function shouldPollDiagnosis(status: DiagnosisStatus) {
  return status === "PROCESSING";
}
