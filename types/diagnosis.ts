import type { DiagnosisStatus } from "@/lib/constants/status";
import type {
  DiagnosisDifficulty,
  DiagnosisImplementationStep,
  DiagnosisRecommendedTask,
} from "@/lib/validators/diagnosis-result";

export type PublicDiagnosisResult = {
  automationScore: number;
  recommendedTasks: DiagnosisRecommendedTask[];
  estimatedSavedHoursMin: string | null;
  estimatedSavedHoursMax: string | null;
  difficulty: DiagnosisDifficulty | null;
  recommendedStack: string[];
  implementationSteps: DiagnosisImplementationStep[];
  aiSummary: string | null;
};

export type PublicDiagnosisData = {
  diagnosis: {
    publicId: string;
    status: DiagnosisStatus;
    painPoint: string | null;
    repetitiveTasks: string[];
    lead: {
      companyName: string;
    };
    result: PublicDiagnosisResult | null;
  };
};
