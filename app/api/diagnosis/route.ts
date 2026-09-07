import { and, eq } from "drizzle-orm";
import { apiError, apiOk, parseJsonBody } from "@/lib/api/responses";
import { getDb } from "@/db";
import { automationLogs, diagnoses, leads } from "@/db/schema";
import {
  isDiagnosisWorkflowConfigured,
  triggerDiagnosisWorkflow,
} from "@/lib/n8n/diagnosis";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { diagnosisSubmissionSchema } from "@/lib/validators/diagnosis";
import { logServerError, serverErrorResponse } from "@/lib/api/server-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKFLOW_FAILURE_MESSAGE =
  "n8n webhook delivery failed after 2 attempts.";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "diagnosis", {
    limit: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    return apiError(
      `Too many requests. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
      429,
    );
  }

  const body = await parseJsonBody(request);
  const parsed = diagnosisSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid diagnosis submission.", 422);
  }

  try {
    const db = getDb();
    const [lead] = await db
      .insert(leads)
      .values({
        companyName: parsed.data.companyName,
        industry: parsed.data.industry,
        employeeCount: parsed.data.employeeCount,
        contactName: parsed.data.contactName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        consultingMethod: parsed.data.consultingMethod,
      })
      .returning();

    const [diagnosis] = await db
      .insert(diagnoses)
      .values({
        leadId: lead.id,
        websiteStatus: parsed.data.websiteStatus,
        currentTools: parsed.data.currentTools,
        repetitiveTasks: parsed.data.repetitiveTasks,
        dailyHours: parsed.data.dailyHours?.toString(),
        monthlyVolume: parsed.data.monthlyVolume,
        painPoint: parsed.data.painPoint,
        budgetRange: parsed.data.budgetRange,
        rawAnswers: parsed.data.rawAnswers ?? parsed.data,
      })
      .returning();

    let n8nStatus: "delivered" | "skipped" | "failed" = "skipped";
    let automationErrorMessage: string | undefined;

    if (isDiagnosisWorkflowConfigured()) {
      await db
        .update(diagnoses)
        .set({ status: "PROCESSING", updatedAt: new Date() })
        .where(
          and(
            eq(diagnoses.id, diagnosis.id),
            eq(diagnoses.status, "SUBMITTED"),
          ),
        );
    }

    try {
      const workflowResult = await triggerDiagnosisWorkflow({
        diagnosisId: diagnosis.id,
        publicId: diagnosis.publicId,
        leadId: lead.id,
        submission: parsed.data,
      });

      n8nStatus = workflowResult.status;
    } catch (error) {
      n8nStatus = "failed";
      automationErrorMessage = WORKFLOW_FAILURE_MESSAGE;

      await db
        .update(diagnoses)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(
          and(
            eq(diagnoses.id, diagnosis.id),
            eq(diagnoses.status, "PROCESSING"),
          ),
        );

      logServerError("diagnosis.workflow_delivery_failed", error, {
        diagnosisId: diagnosis.id,
      });
    }

    await db.insert(automationLogs).values({
      diagnosisId: diagnosis.id,
      workflowName: "diagnosis-analysis",
      status: n8nStatus,
      errorMessage: automationErrorMessage,
      startedAt: new Date(),
      finishedAt: new Date(),
    });

    const finalDiagnosis = await db.query.diagnoses.findFirst({
      columns: { status: true },
      where: eq(diagnoses.id, diagnosis.id),
    });

    if (!finalDiagnosis) {
      throw new Error("Saved diagnosis not found.");
    }

    return apiOk(
      {
        publicId: diagnosis.publicId,
        status: finalDiagnosis.status,
        n8nStatus,
      },
      201,
    );
  } catch (error) {
    return serverErrorResponse(
      "Failed to submit diagnosis.",
      500,
      "diagnosis.submission_failed",
      error,
    );
  }
}
