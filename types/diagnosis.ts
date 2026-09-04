import type { DiagnosisStatus } from "@/lib/constants/status";

export type PublicDiagnosisData = {
  diagnosis: {
    publicId: string;
    status: DiagnosisStatus;
    painPoint: string | null;
    repetitiveTasks: string[];
    lead: {
      companyName: string;
    };
    result: null | {
      automationScore: number;
      recommendedTasks: Record<string, unknown>[];
      estimatedSavedHoursMin: string | null;
      estimatedSavedHoursMax: string | null;
      difficulty: string | null;
      recommendedStack: string[] | null;
      implementationSteps: Record<string, unknown>[] | null;
      aiSummary: string | null;
    };
  };
};
