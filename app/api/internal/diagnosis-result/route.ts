import { eq } from "drizzle-orm";
import { apiError, apiOk, parseJsonBody } from "@/lib/api/responses";
import { getDb } from "@/db";
import { diagnoses, diagnosisResults } from "@/db/schema";
import { verifyInternalApiSecret } from "@/lib/security/internal-secret";
import { diagnosisResultSubmissionSchema } from "@/lib/validators/diagnosis-result";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secretResult = verifyInternalApiSecret(request);

  if (!secretResult.ok) {
    return apiError(secretResult.error, secretResult.status);
  }

  const body = await parseJsonBody(request);
  const parsed = diagnosisResultSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid diagnosis result payload.", 422);
  }

  try {
    const db = getDb();
    const diagnosis = await db.query.diagnoses.findFirst({
      where: eq(diagnoses.publicId, parsed.data.diagnosisPublicId),
    });

    if (!diagnosis) {
      return apiError("Diagnosis not found.", 404);
    }

    const result = await db.transaction(async (transaction) => {
      const [savedResult] = await transaction
        .insert(diagnosisResults)
        .values({
          diagnosisId: diagnosis.id,
          automationScore: parsed.data.automationScore,
          recommendedTasks: parsed.data.recommendedTasks,
          estimatedSavedHoursMin: parsed.data.estimatedSavedHoursMin.toString(),
          estimatedSavedHoursMax: parsed.data.estimatedSavedHoursMax.toString(),
          difficulty: parsed.data.difficulty,
          recommendedStack: parsed.data.recommendedStack,
          implementationSteps: parsed.data.implementationSteps,
          aiSummary: parsed.data.aiSummary,
          rawAiResult: parsed.data,
          modelName: parsed.data.modelName,
        })
        .onConflictDoUpdate({
          target: diagnosisResults.diagnosisId,
          set: {
            automationScore: parsed.data.automationScore,
            recommendedTasks: parsed.data.recommendedTasks,
            estimatedSavedHoursMin:
              parsed.data.estimatedSavedHoursMin.toString(),
            estimatedSavedHoursMax:
              parsed.data.estimatedSavedHoursMax.toString(),
            difficulty: parsed.data.difficulty,
            recommendedStack: parsed.data.recommendedStack,
            implementationSteps: parsed.data.implementationSteps,
            aiSummary: parsed.data.aiSummary,
            rawAiResult: parsed.data,
            modelName: parsed.data.modelName,
          },
        })
        .returning();

      await transaction
        .update(diagnoses)
        .set({ status: "COMPLETED", updatedAt: new Date() })
        .where(eq(diagnoses.id, diagnosis.id));

      return savedResult;
    });

    return apiOk({
      resultId: result.id,
      diagnosisPublicId: diagnosis.publicId,
      status: "COMPLETED",
    });
  } catch (error) {
    console.error("Diagnosis result update failed", error);

    return apiError("Failed to save diagnosis result.", 500);
  }
}
