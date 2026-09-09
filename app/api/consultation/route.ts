import { eq } from "drizzle-orm";
import { apiError, apiOk, parseJsonBody } from "@/lib/api/responses";
import { getDb } from "@/db";
import { consultations, diagnoses, leads } from "@/db/schema";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { consultationSubmissionSchema } from "@/lib/validators/consultation";
import { logServerError, serverErrorResponse } from "@/lib/api/server-error";
import {
  createRequestFingerprint,
  getIdempotencyKey,
  isUniqueViolation,
} from "@/lib/api/idempotency";
import { notifyConsultationRequested } from "@/lib/notifications/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Database = ReturnType<typeof getDb>;

async function findIdempotentConsultation(
  db: Database,
  idempotencyKey: string,
  submissionFingerprint: string,
) {
  const existing = await db.query.consultations.findFirst({
    columns: {
      id: true,
      status: true,
      diagnosisId: true,
      submissionFingerprint: true,
    },
    where: eq(consultations.idempotencyKey, idempotencyKey),
  });

  if (!existing) {
    return undefined;
  }

  if (existing.submissionFingerprint !== submissionFingerprint) {
    return apiError("Idempotency-Key was already used for another request.", 409);
  }

  return apiOk({
    consultationId: existing.id,
    status: existing.status,
    contactSource: existing.diagnosisId ? "diagnosis" : "submission",
    replayed: true,
  });
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "consultation", {
    limit: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    const response = apiError(
      `Too many requests. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
      429,
    );
    response.headers.set("retry-after", rateLimit.retryAfterSeconds.toString());

    return response;
  }

  const body = await parseJsonBody(request);
  const parsed = consultationSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid consultation submission.", 422);
  }

  const idempotencyKey = getIdempotencyKey(request);

  if (!idempotencyKey) {
    return apiError("Valid Idempotency-Key header is required.", 400);
  }

  const submissionFingerprint = createRequestFingerprint(parsed.data);

  try {
    const db = getDb();
    const existingResponse = await findIdempotentConsultation(
      db,
      idempotencyKey,
      submissionFingerprint,
    );

    if (existingResponse) {
      return existingResponse;
    }

    let saved:
      | {
          consultation: typeof consultations.$inferSelect;
          contact: {
            companyName: string;
            contactName: string;
            email: string;
          };
          diagnosisPublicId?: string;
        }
      | undefined;

    try {
      saved = await db.transaction(async (transaction) => {
        let leadId: string;
        let diagnosisId: string | undefined;
        let diagnosisPublicId: string | undefined;
        let contact: {
          companyName: string;
          contactName: string;
          email: string;
        };

        if (parsed.data.diagnosisPublicId) {
          const diagnosis = await transaction.query.diagnoses.findFirst({
            where: eq(diagnoses.publicId, parsed.data.diagnosisPublicId),
            with: {
              lead: {
                columns: {
                  companyName: true,
                  contactName: true,
                  email: true,
                },
              },
            },
          });

          if (!diagnosis) {
            return undefined;
          }

          leadId = diagnosis.leadId;
          diagnosisId = diagnosis.id;
          diagnosisPublicId = parsed.data.diagnosisPublicId;
          contact = diagnosis.lead;
        } else {
          const [lead] = await transaction
            .insert(leads)
            .values({
              companyName: parsed.data.companyName ?? "",
              contactName: parsed.data.contactName ?? "",
              email: parsed.data.email ?? "",
              phone: parsed.data.phone,
            })
            .returning();

          leadId = lead.id;
          contact = {
            companyName: parsed.data.companyName ?? "",
            contactName: parsed.data.contactName ?? "",
            email: parsed.data.email ?? "",
          };
        }

        const [savedConsultation] = await transaction
          .insert(consultations)
          .values({
            idempotencyKey,
            submissionFingerprint,
            leadId,
            diagnosisId,
            preferredDate: parsed.data.preferredDate,
            consultationType: parsed.data.consultationType,
            message: parsed.data.message,
          })
          .returning();

        return {
          consultation: savedConsultation,
          contact,
          diagnosisPublicId,
        };
      });

      if (!saved) {
        return apiError("Diagnosis not found.", 404);
      }
    } catch (error) {
      if (isUniqueViolation(error)) {
        const concurrentResponse = await findIdempotentConsultation(
          db,
          idempotencyKey,
          submissionFingerprint,
        );

        if (concurrentResponse) {
          return concurrentResponse;
        }
      }

      throw error;
    }

    try {
      await notifyConsultationRequested({
        consultationId: saved.consultation.id,
        diagnosisPublicId: saved.diagnosisPublicId,
        companyName: saved.contact.companyName,
        contactName: saved.contact.contactName,
        email: saved.contact.email,
        consultationType: parsed.data.consultationType,
      });
    } catch (error) {
      logServerError("telegram.consultation_notification_failed", error, {
        consultationId: saved.consultation.id,
      });
    }

    return apiOk(
      {
        consultationId: saved.consultation.id,
        status: saved.consultation.status,
        contactSource: parsed.data.diagnosisPublicId
          ? "diagnosis"
          : "submission",
      },
      201,
    );
  } catch (error) {
    return serverErrorResponse(
      "Failed to submit consultation.",
      500,
      "consultation.submission_failed",
      error,
    );
  }
}
