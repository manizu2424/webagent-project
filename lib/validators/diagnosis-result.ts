import { z } from "zod";
import { diagnosisPublicIdSchema } from "./diagnosis";

export const diagnosisDifficultySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const recommendedTaskSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    reason: z.string().trim().min(1).max(500),
    difficulty: diagnosisDifficultySchema,
    estimatedMonthlySavedHours: z.number().nonnegative().max(744),
  })
  .strict();

export const implementationStepSchema = z
  .object({
    order: z.number().int().positive().max(10),
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(500),
  })
  .strict();

export const recommendedTasksSchema = z
  .array(recommendedTaskSchema)
  .min(1)
  .max(5);

export const recommendedStackSchema = z
  .array(z.string().trim().min(1).max(50))
  .min(1)
  .max(8);

export const implementationStepsSchema = z
  .array(implementationStepSchema)
  .min(1)
  .max(6)
  .superRefine((steps, context) => {
    steps.forEach((step, index) => {
      const expectedOrder = index + 1;

      if (step.order !== expectedOrder) {
        context.addIssue({
          code: "custom",
          message: `implementationSteps order must be consecutive from 1; expected ${expectedOrder}.`,
          path: [index, "order"],
        });
      }
    });
  });

export const diagnosisResultSubmissionSchema = z
  .object({
    diagnosisPublicId: diagnosisPublicIdSchema,
    automationScore: z.number().int().min(0).max(100),
    recommendedTasks: recommendedTasksSchema,
    estimatedSavedHoursMin: z.number().nonnegative().max(744),
    estimatedSavedHoursMax: z.number().nonnegative().max(744),
    difficulty: diagnosisDifficultySchema,
    recommendedStack: recommendedStackSchema,
    implementationSteps: implementationStepsSchema,
    aiSummary: z.string().trim().min(1).max(2_000),
    modelName: z.string().trim().min(1).max(100),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.estimatedSavedHoursMin > value.estimatedSavedHoursMax) {
      context.addIssue({
        code: "custom",
        message:
          "estimatedSavedHoursMin must be less than or equal to estimatedSavedHoursMax.",
        path: ["estimatedSavedHoursMax"],
      });
    }

  });

export type DiagnosisDifficulty = z.infer<typeof diagnosisDifficultySchema>;
export type DiagnosisRecommendedTask = z.infer<typeof recommendedTaskSchema>;
export type DiagnosisImplementationStep = z.infer<
  typeof implementationStepSchema
>;

export type DiagnosisResultSubmissionInput = z.infer<
  typeof diagnosisResultSubmissionSchema
>;
