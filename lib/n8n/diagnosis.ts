import type { DiagnosisSubmissionInput } from "@/lib/validators/diagnosis";

type TriggerDiagnosisWorkflowInput = {
  diagnosisId: string;
  publicId: string;
  leadId: string;
  submission: DiagnosisSubmissionInput;
};

export async function triggerDiagnosisWorkflow(
  payload: TriggerDiagnosisWorkflowInput,
) {
  const webhookUrl = process.env.N8N_DIAGNOSIS_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      status: "skipped",
      reason: "N8N_DIAGNOSIS_WEBHOOK_URL is not configured.",
    } as const;
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(process.env.N8N_WEBHOOK_SECRET
            ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        return { status: "delivered" } as const;
      }

      lastError = new Error(`n8n webhook failed with status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("n8n webhook failed.");
}
