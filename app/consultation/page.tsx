import Link from "next/link";
import { ConsultationForm } from "@/components/consultation/consultation-form";

type ConsultationPageProps = {
  searchParams: Promise<{
    diagnosis?: string;
  }>;
};

export default async function ConsultationPage({
  searchParams,
}: ConsultationPageProps) {
  const { diagnosis } = await searchParams;

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-primary">
          WEBAGENT.KR
        </Link>
        <div className="mt-8 grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
          <aside>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Consultation
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight">
              진단 결과를 실제 자동화 구축 범위로 연결합니다.
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              진단 ID가 있으면 제출했던 회사 정보와 연결되어 상담 요청이 저장됩니다.
            </p>
          </aside>
          <ConsultationForm initialDiagnosisPublicId={diagnosis} />
        </div>
      </div>
    </main>
  );
}
