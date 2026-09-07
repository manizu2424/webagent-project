import { z } from "zod";
import { diagnosisPublicIdSchema } from "./diagnosis";
import { blankToUndefined, optionalDate, optionalString } from "./shared";

export const consultationSubmissionSchema = z
  .object({
    diagnosisPublicId: z.preprocess(
      blankToUndefined,
      diagnosisPublicIdSchema.optional(),
    ),
    companyName: optionalString(200),
    contactName: optionalString(100),
    email: optionalString(255).refine(
      (value) => !value || z.string().email().safeParse(value).success,
      {
        message: "Invalid email address.",
      },
    ),
    phone: optionalString(30),
    preferredDate: optionalDate,
    consultationType: optionalString(50),
    message: optionalString(),
    privacyConsent: z.literal(true),
  })
  .refine(
    (value) =>
      Boolean(value.diagnosisPublicId) ||
      Boolean(value.companyName && value.contactName && value.email),
    {
      message:
        "diagnosisPublicId or companyName, contactName, and email are required.",
    },
  );

export type ConsultationSubmissionInput = z.infer<
  typeof consultationSubmissionSchema
>;
