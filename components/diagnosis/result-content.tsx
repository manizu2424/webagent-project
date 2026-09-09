import type { PublicDiagnosisResult } from "@/types/diagnosis";

const difficultyLabels = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
} as const;

function formatHours(value: number | string | null) {
  if (value === null) {
    return null;
  }

  const hours = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(hours) || hours < 0) {
    return null;
  }

  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(hours);
}

function EstimatedHours({ result }: { result: PublicDiagnosisResult }) {
  const minimum = formatHours(result.estimatedSavedHoursMin);
  const maximum = formatHours(result.estimatedSavedHoursMax);

  if (minimum === null || maximum === null) {
    return <p className="mt-2 text-sm text-muted-foreground">정보 없음</p>;
  }

  return (
    <p className="mt-2 text-2xl font-bold text-foreground">
      월 {minimum}~{maximum}시간
    </p>
  );
}

export function CompletedDiagnosisResult({
  result,
}: {
  result: PublicDiagnosisResult;
}) {
  return (
    <div className="grid gap-6">
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">
          AI 분석이 완료되었습니다.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-semibold text-muted-foreground">
              자동화 가능 점수
            </p>
            <p className="mt-2 text-4xl font-bold text-primary">
              {result.automationScore}
              <span className="ml-1 text-base text-muted-foreground">/ 100</span>
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-semibold text-muted-foreground">
              월 예상 절감 시간
            </p>
            <EstimatedHours result={result} />
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-semibold text-muted-foreground">
              전체 구축 난이도
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {result.difficulty
                ? difficultyLabels[result.difficulty]
                : "정보 없음"}
            </p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          {result.aiSummary ?? "요약 결과가 아직 없습니다."}
        </p>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          예상 절감 시간과 효과는 입력 내용을 바탕으로 한 추정치이며 실제 운영
          환경에 따라 달라질 수 있습니다.
        </p>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-bold">우선 추천 자동화 업무</h2>
        {result.recommendedTasks.length > 0 ? (
          <div className="mt-5 grid gap-4">
            {result.recommendedTasks.map((task, index) => (
              <article
                key={`${task.name}-${index}`}
                className="rounded-lg border p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-primary">
                      추천 {index + 1}순위
                    </p>
                    <h3 className="mt-1 text-lg font-bold">{task.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-muted px-3 py-1">
                      난이도 {difficultyLabels[task.difficulty]}
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1">
                      월 {formatHours(task.estimatedMonthlySavedHours)}시간 절감 예상
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {task.reason}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            추천 자동화 업무가 아직 준비되지 않았습니다.
          </p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-bold">추천 기술 스택</h2>
        {result.recommendedStack.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {result.recommendedStack.map((technology, index) => (
              <span
                key={`${technology}-${index}`}
                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-semibold text-primary"
              >
                {technology}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            추천 기술 스택 정보가 아직 준비되지 않았습니다.
          </p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-bold">권장 구축 단계</h2>
        {result.implementationSteps.length > 0 ? (
          <ol className="mt-5 grid gap-4">
            {result.implementationSteps.map((step) => (
              <li key={step.order} className="flex gap-4 rounded-lg border p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.order}
                </span>
                <div>
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            권장 구축 단계가 아직 준비되지 않았습니다.
          </p>
        )}
      </section>
    </div>
  );
}
