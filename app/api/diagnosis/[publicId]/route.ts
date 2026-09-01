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
      with: {
        lead: true,
        result: true,
      },
    });

    if (!diagnosis) {
      return apiError("Diagnosis not found.", 404);
    }

    return apiOk({ diagnosis });
  } catch (error) {
    console.error("Diagnosis lookup failed", error);

    return apiError("Failed to load diagnosis.", 500);
  }
}
