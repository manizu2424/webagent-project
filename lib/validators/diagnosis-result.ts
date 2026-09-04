import { z } from "zod";
import { diagnosisPublicIdSchema } from "./diagnosis";

export const diagnosisDifficultySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const recommendedTaskSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    reason: z.string().trim().min(1).max(500),
    difficulty: diagnosisDifficultySchema,
    estimatedMonthlySavedHours: z.coerce.number().nonnegative().max(744),
  })
  .strict();

export const implementationStepSchema = z
  .object({
    order: z.coerce.number().int().positive().max(10),
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(500),
  })
  .strict();

export const diagnosisResultSubmissionSchema = z
  .object({
    diagnosisPublicId: diagnosisPublicIdSchema,
    automationScore: z.coerce.number().int().min(0).max(100),
    recommendedTasks: z.array(recommendedTaskSchema).min(1).max(5),
    estimatedSavedHoursMin: z.coerce.number().nonnegative().max(744),
    estimatedSavedHoursMax: z.coerce.number().nonnegative().max(744),
    difficulty: diagnosisDifficultySchema,
    recommendedStack: z
      .array(z.string().trim().min(1).max(50))
      .min(1)
      .max(8),
    implementationSteps: z.array(implementationStepSchema).min(1).max(6),
    aiSummary: z.string().trim().min(1).max(2_000),
    modelName: z.string().trim().min(1).max(100),
  })
  .strict()
  .refine(
    (value) => value.estimatedSavedHoursMin <= value.estimatedSavedHoursMax,
    {
      message:
        "estimatedSavedHoursMin must be less than or equal to estimatedSavedHoursMax.",
      path: ["estimatedSavedHoursMax"],
    },
  );

export type DiagnosisResultSubmissionInput = z.infer<
  typeof diagnosisResultSubmissionSchema
>;
