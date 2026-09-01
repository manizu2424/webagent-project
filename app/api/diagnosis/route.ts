import { eq } from "drizzle-orm";
import { apiError, apiOk, parseJsonBody } from "@/lib/api/responses";
import { getDb } from "@/db";
import { automationLogs, diagnoses, leads } from "@/db/schema";
import { triggerDiagnosisWorkflow } from "@/lib/n8n/diagnosis";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { diagnosisSubmissionSchema } from "@/lib/validators/diagnosis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    try {
      const workflowResult = await triggerDiagnosisWorkflow({
        diagnosisId: diagnosis.id,
        publicId: diagnosis.publicId,
        leadId: lead.id,
        submission: parsed.data,
      });

      n8nStatus = workflowResult.status;

      if (workflowResult.status === "delivered") {
        await db
          .update(diagnoses)
          .set({ status: "PROCESSING", updatedAt: new Date() })
          .where(eq(diagnoses.id, diagnosis.id));
      }
    } catch (error) {
      n8nStatus = "failed";
      console.error("n8n diagnosis webhook failed", error);
    }

    await db.insert(automationLogs).values({
      diagnosisId: diagnosis.id,
      workflowName: "diagnosis-analysis",
      status: n8nStatus,
      startedAt: new Date(),
      finishedAt: new Date(),
    });

    return apiOk(
      {
        publicId: diagnosis.publicId,
        status: n8nStatus === "delivered" ? "PROCESSING" : diagnosis.status,
        n8nStatus,
      },
      201,
    );
  } catch (error) {
    console.error("Diagnosis submission failed", error);

    return apiError("Failed to submit diagnosis.", 500);
  }
}
