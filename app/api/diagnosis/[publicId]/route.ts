import { eq } from "drizzle-orm";
import { apiError, apiOk } from "@/lib/api/responses";
import { getDb } from "@/db";
import { diagnosisPublicIdSchema } from "@/lib/validators/diagnosis";
import { diagnoses } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    publicId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { publicId } = await context.params;
  const parsedPublicId = diagnosisPublicIdSchema.safeParse(publicId);

  if (!parsedPublicId.success) {
    return apiError("Invalid diagnosis public id.", 400);
  }

  try {
    const db = getDb();
    const diagnosis = await db.query.diagnoses.findFirst({
      where: eq(diagnoses.publicId, parsedPublicId.data),
      columns: {
        publicId: true,
        status: true,
        painPoint: true,
        repetitiveTasks: true,
      },
      with: {
        lead: {
          columns: {
            companyName: true,
          },
        },
        result: {
          columns: {
            automationScore: true,
            recommendedTasks: true,
            estimatedSavedHoursMin: true,
            estimatedSavedHoursMax: true,
            difficulty: true,
            recommendedStack: true,
            implementationSteps: true,
            aiSummary: true,
          },
        },
      },
    });

    if (!diagnosis) {
      return apiError("Diagnosis not found.", 404);
    }

    return apiOk({
      diagnosis: {
        publicId: diagnosis.publicId,
        status: diagnosis.status,
        painPoint: diagnosis.painPoint,
        repetitiveTasks: diagnosis.repetitiveTasks,
        lead: {
          companyName: diagnosis.lead.companyName,
        },
        result: diagnosis.result
          ? {
              automationScore: diagnosis.result.automationScore,
              recommendedTasks: diagnosis.result.recommendedTasks,
              estimatedSavedHoursMin:
                diagnosis.result.estimatedSavedHoursMin,
              estimatedSavedHoursMax:
                diagnosis.result.estimatedSavedHoursMax,
              difficulty: diagnosis.result.difficulty,
              recommendedStack: diagnosis.result.recommendedStack,
              implementationSteps: diagnosis.result.implementationSteps,
              aiSummary: diagnosis.result.aiSummary,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Diagnosis lookup failed", error);

    return apiError("Failed to load diagnosis.", 500);
  }
}
