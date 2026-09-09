import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PublicDiagnosisResult } from "@/types/diagnosis";
import { CompletedDiagnosisResult } from "./result-content";

const completeResult: PublicDiagnosisResult = {
  automationScore: 85,
  recommendedTasks: [
    {
      name: "보고서 자동화",
      reason: "반복 작성 시간이 큽니다.",
      difficulty: "MEDIUM",
      estimatedMonthlySavedHours: 12.5,
    },
  ],
  estimatedSavedHoursMin: "10.00",
  estimatedSavedHoursMax: "20.00",
  difficulty: "MEDIUM",
  recommendedStack: ["n8n", "PostgreSQL"],
  implementationSteps: [
    {
      order: 1,
      title: "데이터 연결",
      description: "업무 데이터를 워크플로에 연결합니다.",
    },
  ],
  aiSummary: "보고서 업무부터 자동화하는 것이 효과적입니다.",
};

describe("CompletedDiagnosisResult", () => {
  it("renders every public structured result field", () => {
    const html = renderToStaticMarkup(
      createElement(CompletedDiagnosisResult, { result: completeResult }),
    );

    expect(html).toContain("85");
    expect(html).toContain("월 10~20시간");
    expect(html).toContain("전체 구축 난이도");
    expect(html).toContain("보통");
    expect(html).toContain("보고서 자동화");
    expect(html).toContain("반복 작성 시간이 큽니다.");
    expect(html).toContain("월 12.5시간 절감 예상");
    expect(html).toContain("n8n");
    expect(html).toContain("PostgreSQL");
    expect(html).toContain("데이터 연결");
    expect(html).toContain("업무 데이터를 워크플로에 연결합니다.");
    expect(html).toContain("입력 내용을 바탕으로 한 추정치");
  });

  it("renders explicit fallbacks for missing optional result data", () => {
    const html = renderToStaticMarkup(
      createElement(CompletedDiagnosisResult, {
        result: {
          ...completeResult,
          recommendedTasks: [],
          estimatedSavedHoursMin: null,
          estimatedSavedHoursMax: null,
          difficulty: null,
          recommendedStack: [],
          implementationSteps: [],
          aiSummary: null,
        },
      }),
    );

    expect(html).toContain("요약 결과가 아직 없습니다.");
    expect(html).toContain("추천 자동화 업무가 아직 준비되지 않았습니다.");
    expect(html).toContain("추천 기술 스택 정보가 아직 준비되지 않았습니다.");
    expect(html).toContain("권장 구축 단계가 아직 준비되지 않았습니다.");
    expect(html.match(/정보 없음/g)?.length).toBe(2);
  });
});
