import Link from "next/link";
import { DiagnosisWizard } from "@/components/diagnosis/diagnosis-wizard";

export default function DiagnosisPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-primary">
          WEBAGENT.KR
        </Link>
        <div className="mt-8 grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
          <aside>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Free Diagnosis
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight">
              반복 업무를 입력하면 자동화 가능성을 분석합니다.
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              제출된 정보는 진단 결과 생성과 상담 준비에만 사용됩니다.
            </p>
          </aside>
          <DiagnosisWizard />
        </div>
      </div>
    </main>
  );
}
