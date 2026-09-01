import { z } from "zod";
import { diagnosisPublicIdSchema } from "./diagnosis";
import { optionalNonNegativeNumber, optionalString } from "./shared";

export const diagnosisResultSubmissionSchema = z.object({
  diagnosisPublicId: diagnosisPublicIdSchema,
  automationScore: z.coerce.number().int().min(0).max(100),
  recommendedTasks: z.array(z.record(z.string(), z.unknown())).default([]),
  estimatedSavedHoursMin: optionalNonNegativeNumber,
  estimatedSavedHoursMax: optionalNonNegativeNumber,
  difficulty: optionalString(50),
  recommendedStack: z.array(z.string().trim().min(1)).default([]),
  implementationSteps: z.array(z.record(z.string(), z.unknown())).default([]),
  aiSummary: optionalString(),
  rawAiResult: z.record(z.string(), z.unknown()).optional(),
  modelName: optionalString(100),
});

export type DiagnosisResultSubmissionInput = z.infer<
  typeof diagnosisResultSubmissionSchema
>;
