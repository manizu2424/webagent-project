import { z } from "zod";
import {
  optionalNonNegativeInt,
  optionalNonNegativeNumber,
  optionalPositiveInt,
  optionalString,
} from "./shared";

export const diagnosisSubmissionSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  industry: optionalString(100),
  employeeCount: optionalPositiveInt,
  contactName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: optionalString(30),
  consultingMethod: optionalString(50),
  privacyConsent: z.literal(true),
  websiteStatus: optionalString(50),
  currentTools: z.array(z.string().trim().min(1)).default([]),
  repetitiveTasks: z.array(z.string().trim().min(1)).default([]),
  dailyHours: optionalNonNegativeNumber.refine(
    (value) => value === undefined || value <= 24,
    {
      message: "Daily hours must be 24 or less.",
    },
  ),
  monthlyVolume: optionalNonNegativeInt,
  painPoint: optionalString(),
  budgetRange: optionalString(50),
  rawAnswers: z.record(z.string(), z.unknown()).optional(),
});

export const diagnosisPublicIdSchema = z.string().uuid();

export type DiagnosisSubmissionInput = z.infer<
  typeof diagnosisSubmissionSchema
>;
