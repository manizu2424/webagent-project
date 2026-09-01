import { eq } from "drizzle-orm";
import { apiError, apiOk, parseJsonBody } from "@/lib/api/responses";
import { getDb } from "@/db";
import { consultations, diagnoses, leads } from "@/db/schema";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { consultationSubmissionSchema } from "@/lib/validators/consultation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "consultation", {
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
  const parsed = consultationSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid consultation submission.", 422);
  }

  try {
    const db = getDb();
    let leadId: string;
    let diagnosisId: string | undefined;

    if (parsed.data.diagnosisPublicId) {
      const diagnosis = await db.query.diagnoses.findFirst({
        where: eq(diagnoses.publicId, parsed.data.diagnosisPublicId),
        with: {
          lead: true,
        },
      });

      if (!diagnosis) {
        return apiError("Diagnosis not found.", 404);
      }

      leadId = diagnosis.leadId;
      diagnosisId = diagnosis.id;
    } else {
      const [lead] = await db
        .insert(leads)
        .values({
          companyName: parsed.data.companyName ?? "",
          contactName: parsed.data.contactName ?? "",
          email: parsed.data.email ?? "",
          phone: parsed.data.phone,
        })
        .returning();

      leadId = lead.id;
    }

    const [consultation] = await db
      .insert(consultations)
      .values({
        leadId,
        diagnosisId,
        preferredDate: parsed.data.preferredDate,
        consultationType: parsed.data.consultationType,
        message: parsed.data.message,
      })
      .returning();

    return apiOk(
      {
        consultationId: consultation.id,
        status: consultation.status,
      },
      201,
    );
  } catch (error) {
    console.error("Consultation submission failed", error);

    return apiError("Failed to submit consultation.", 500);
  }
}
